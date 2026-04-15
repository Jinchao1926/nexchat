import type { Context } from 'hono';

import {
  getAuthorizedConversation,
  isConversationResponse,
} from '@/api/conversation/conversation-auth';
import {
  createMessage,
  listRecentCompletedMessagesByConversationId,
  updateMessageStatus,
} from '@/api/message/message.service';
import { AI_SYSTEM_PROMPT } from '@/config';
import { type AiChatMessage, createAiProvider } from '@/lib/ai/provider';

import type { StreamAiChatBody } from './ai.schemas';

function encodeSse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function toAiMessages(messages: Array<{ role: string; content: string }>) {
  return messages
    .filter((message) => message.role !== 'system' || message.content.trim())
    .map(
      (message): AiChatMessage => ({
        role: message.role as AiChatMessage['role'],
        content: message.content,
      })
    );
}

export async function streamAiChatHandler(c: Context) {
  const data = c.req.valid('json' as never) as StreamAiChatBody;
  const conversationId = Number(c.req.param('id'));
  const conversation = getAuthorizedConversation(c, conversationId);

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const provider = createAiProvider();
  const model = data.model ?? provider.defaultModel;
  const userMessage = await createMessage({
    conversationId: conversation.id,
    userId: conversation.userId,
    role: 'user',
    content: data.content,
    status: 'completed',
  });

  if (!userMessage) {
    return c.json({ message: 'Failed to create user message' }, 400);
  }

  const assistantMessage = await createMessage({
    conversationId: conversation.id,
    userId: conversation.userId,
    role: 'assistant',
    content: '',
    status: 'streaming',
    provider: provider.name,
    model,
  });

  if (!assistantMessage) {
    return c.json({ message: 'Failed to create assistant message' }, 400);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let content = '';

      controller.enqueue(
        encoder.encode(
          encodeSse('start', {
            userMessageId: userMessage.id,
            assistantMessageId: assistantMessage.id,
            provider: provider.name,
            model,
          })
        )
      );

      try {
        const recentMessages = listRecentCompletedMessagesByConversationId(
          conversation.id
        );
        const messages = toAiMessages([
          { role: 'system', content: AI_SYSTEM_PROMPT },
          ...recentMessages,
        ]);

        for await (const chunk of provider.streamChat({ model, messages })) {
          content += chunk.content;
          controller.enqueue(
            encoder.encode(encodeSse('delta', { content: chunk.content }))
          );
        }

        await updateMessageStatus(assistantMessage.id, {
          content,
          status: 'completed',
          error: null,
        });

        controller.enqueue(
          encoder.encode(
            encodeSse('done', {
              assistantMessageId: assistantMessage.id,
            })
          )
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'AI stream failed';

        await updateMessageStatus(assistantMessage.id, {
          content,
          status: 'failed',
          error: message,
        });

        controller.enqueue(encoder.encode(encodeSse('error', { message })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
