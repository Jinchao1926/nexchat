import {
  type MessageRecord,
  createMessage,
  listRecentCompletedMessagesByConversationId,
  updateMessageStatus,
} from '@/api/message/message.service';
import { AI_SYSTEM_PROMPT } from '@/config';
import { type AiChatMessage, type AiProvider } from '@/lib/ai/provider';

import { createSseWriter } from './ai.sse';

export interface ConversationForAi {
  id: number;
  userId: string;
}

interface CreateAiChatStreamInput {
  conversation: ConversationForAi;
  provider: AiProvider;
  model: string;
  content: string;
}

interface AiChatStreamDependencies {
  createMessage: typeof createMessage;
  listRecentCompletedMessagesByConversationId:
    typeof listRecentCompletedMessagesByConversationId;
  updateMessageStatus: typeof updateMessageStatus;
}

type CreateAiChatStreamResult =
  | {
      ok: true;
      stream: ReadableStream<Uint8Array>;
    }
  | {
      ok: false;
      message: string;
    };

const defaultDependencies: AiChatStreamDependencies = {
  createMessage,
  listRecentCompletedMessagesByConversationId,
  updateMessageStatus,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'AI stream failed';
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

function getAiChatMessages(
  conversationId: number,
  dependencies: AiChatStreamDependencies
) {
  const recentMessages = dependencies.listRecentCompletedMessagesByConversationId(
    conversationId
  );

  return toAiMessages([
    { role: 'system', content: AI_SYSTEM_PROMPT },
    ...recentMessages,
  ]);
}

async function createUserMessage(
  conversation: ConversationForAi,
  content: string,
  dependencies: AiChatStreamDependencies
) {
  return dependencies.createMessage({
    conversationId: conversation.id,
    userId: conversation.userId,
    role: 'user',
    content,
    status: 'completed',
  });
}

async function createStreamingAssistantMessage(
  conversation: ConversationForAi,
  provider: AiProvider,
  model: string,
  dependencies: AiChatStreamDependencies
) {
  return dependencies.createMessage({
    conversationId: conversation.id,
    userId: conversation.userId,
    role: 'assistant',
    content: '',
    status: 'streaming',
    provider: provider.name,
    model,
  });
}

async function completeAssistantMessage(
  id: number,
  content: string,
  dependencies: AiChatStreamDependencies
) {
  await dependencies.updateMessageStatus(id, {
    content,
    status: 'completed',
    error: null,
  });
}

async function failAssistantMessage(
  id: number,
  content: string,
  error: string,
  dependencies: AiChatStreamDependencies
) {
  await dependencies.updateMessageStatus(id, {
    content,
    status: 'failed',
    error,
  });
}

function streamAssistantChat(input: {
  conversation: ConversationForAi;
  provider: AiProvider;
  model: string;
  userMessage: MessageRecord;
  assistantMessage: MessageRecord;
  dependencies: AiChatStreamDependencies;
}) {
  const { conversation, provider, model, userMessage, assistantMessage } =
    input;
  const { dependencies } = input;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const sendSse = createSseWriter(controller);
      let content = '';

      sendSse('start', {
        conversationId: conversation.id,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        provider: provider.name,
        model,
      });

      try {
        const messages = getAiChatMessages(conversation.id, dependencies);

        for await (const chunk of provider.streamChat({ model, messages })) {
          content += chunk.content;
          sendSse('delta', { content: chunk.content });
        }

        await completeAssistantMessage(
          assistantMessage.id,
          content,
          dependencies
        );
        sendSse('done', { assistantMessageId: assistantMessage.id });
      } catch (error) {
        const message = getErrorMessage(error);

        await failAssistantMessage(
          assistantMessage.id,
          content,
          message,
          dependencies
        );
        sendSse('error', { message });
      } finally {
        controller.close();
      }
    },
  });
}

export async function createAiChatStream(
  input: CreateAiChatStreamInput,
  dependencies: AiChatStreamDependencies = defaultDependencies
): Promise<CreateAiChatStreamResult> {
  const { conversation, provider, model, content } = input;
  const userMessage = await createUserMessage(
    conversation,
    content,
    dependencies
  );

  if (!userMessage) {
    return {
      ok: false,
      message: 'Failed to create user message',
    };
  }

  const assistantMessage = await createStreamingAssistantMessage(
    conversation,
    provider,
    model,
    dependencies
  );

  if (!assistantMessage) {
    return {
      ok: false,
      message: 'Failed to create assistant message',
    };
  }

  return {
    ok: true,
    stream: streamAssistantChat({
      conversation,
      provider,
      model,
      userMessage,
      assistantMessage,
      dependencies,
    }),
  };
}
