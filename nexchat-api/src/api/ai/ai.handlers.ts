import type { Context } from 'hono';

import { getUserId } from '@/api/conversation/conversation-auth';
import { createAiProvider } from '@/lib/ai/provider';

import { resolveAiConversation } from './ai.service';
import type {
  StreamAiChatBody,
  StreamConversationAiChatBody,
} from './ai.schemas';
import { SSE_HEADERS } from './ai.sse';
import { createAiChatStream } from './ai.stream';

interface StreamAiInput {
  content: string;
  model?: string | undefined;
  conversationId?: number | undefined;
}

async function streamAiChat(
  c: Context,
  data: StreamAiInput
) {
  const conversationResult = await resolveAiConversation({
    userId: getUserId(c),
    content: data.content,
    ...(data.conversationId
      ? { conversationId: data.conversationId }
      : undefined),
  });

  if (!conversationResult.ok) {
    return c.json(
      { message: conversationResult.message },
      conversationResult.status
    );
  }

  const provider = createAiProvider();
  const model = data.model ?? provider.defaultModel;
  const result = await createAiChatStream({
    conversation: conversationResult.conversation,
    provider,
    model,
    content: data.content,
  });

  if (!result.ok) {
    return c.json({ message: result.message }, 400);
  }

  return new Response(result.stream, {
    headers: SSE_HEADERS,
  });
}

export async function streamAiChatHandler(c: Context) {
  const data = c.req.valid('json' as never) as StreamAiChatBody;

  return streamAiChat(c, data);
}

export async function streamConversationAiChatHandler(c: Context) {
  const data = c.req.valid('json' as never) as StreamConversationAiChatBody;

  return streamAiChat(c, {
    ...data,
    conversationId: Number(c.req.param('id')),
  });
}
