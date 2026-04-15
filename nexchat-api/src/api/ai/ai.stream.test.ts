import assert from 'node:assert/strict';
import test from 'node:test';

import type { MessageRecord } from '@/api/message/message.service';

import { createAiChatStream } from './ai.stream';

interface MessageRecordInput {
  id?: number | undefined;
  conversationId?: number | undefined;
  userId?: string | undefined;
  role?: MessageRecord['role'] | undefined;
  content?: string | undefined;
  status?: MessageRecord['status'] | undefined;
  provider?: string | null | undefined;
  model?: string | null | undefined;
  error?: string | null | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

function createMessageRecord(input: MessageRecordInput): MessageRecord {
  return {
    id: input.id ?? 1,
    conversationId: input.conversationId ?? 42,
    userId: input.userId ?? 'user-1',
    role: input.role ?? 'user',
    content: input.content ?? '',
    status: input.status ?? 'completed',
    provider: input.provider ?? null,
    model: input.model ?? null,
    error: input.error ?? null,
    createdAt: input.createdAt ?? new Date(1),
    updatedAt: input.updatedAt ?? new Date(1),
  };
}

test('createAiChatStream emits conversationId in the start event', async () => {
  const updates: Array<{
    id: number;
    content?: string | undefined;
    status?: string | undefined;
  }> = [];

  const result = await createAiChatStream(
    {
      conversation: {
        id: 42,
        userId: 'user-1',
      },
      provider: {
        name: 'test-provider',
        defaultModel: 'test-model',
        async *streamChat() {
          yield { content: '你' };
          yield { content: '好' };
        },
      },
      model: 'test-model',
      content: '你好',
    },
    {
      async createMessage(input) {
        if (input.role === 'user') {
          return createMessageRecord({
            id: 11,
            conversationId: input.conversationId,
            userId: input.userId,
            role: input.role,
            content: input.content,
          });
        }

        return createMessageRecord({
          id: 12,
          conversationId: input.conversationId,
          userId: input.userId,
          role: input.role,
          content: input.content,
          status: input.status,
          provider: input.provider,
          model: input.model,
        });
      },
      listRecentCompletedMessagesByConversationId() {
        return [];
      },
      async updateMessageStatus(id, input) {
        updates.push({
          id,
          content: input.content,
          status: input.status,
        });

        return createMessageRecord({
          id,
          role: 'assistant',
          content: input.content ?? '',
          status: input.status ?? 'completed',
        });
      },
    }
  );

  assert.equal(result.ok, true);

  const reader = result.stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const chunk = await reader.read();

    if (chunk.done) {
      break;
    }

    output += decoder.decode(chunk.value);
  }

  assert.match(output, /event: start/);
  assert.match(output, /"conversationId":42/);
  assert.match(output, /"userMessageId":11/);
  assert.match(output, /"assistantMessageId":12/);
  assert.deepEqual(updates, [
    {
      id: 12,
      content: '你好',
      status: 'completed',
    },
  ]);
});
