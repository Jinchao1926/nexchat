import assert from 'node:assert/strict';
import test from 'node:test';

import {
  messageResponseSchema,
  messageSingleResponseSchema,
  messagesListResponseSchema,
} from './message.responses';

test('messageResponseSchema accepts a message payload', () => {
  const result = messageResponseSchema.safeParse({
    id: 1,
    conversationId: 1,
    userId: 'user-1',
    role: 'user',
    content: 'Hello',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
  });

  assert.equal(result.success, true);
});

test('messagesListResponseSchema wraps message arrays in data', () => {
  const result = messagesListResponseSchema.safeParse({
    data: [
      {
        id: 1,
        conversationId: 1,
        userId: 'user-1',
        role: 'assistant',
        content: 'Hi',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
    ],
  });

  assert.equal(result.success, true);
});

test('messageSingleResponseSchema rejects missing data wrappers', () => {
  const result = messageSingleResponseSchema.safeParse({
    id: 1,
    conversationId: 1,
    userId: 'user-1',
    role: 'user',
    content: 'Hello',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
  });

  assert.equal(result.success, false);
});
