import assert from 'node:assert/strict';
import test from 'node:test';

import {
  conversationResponseSchema,
  conversationSingleResponseSchema,
  conversationsListResponseSchema,
} from './conversation.responses';

test('conversationResponseSchema accepts a conversation payload', () => {
  const result = conversationResponseSchema.safeParse({
    id: 1,
    userId: 'user-1',
    title: 'Hello',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
  });

  assert.equal(result.success, true);
});

test('conversationsListResponseSchema wraps conversation arrays in data', () => {
  const result = conversationsListResponseSchema.safeParse({
    data: [
      {
        id: 1,
        userId: 'user-1',
        title: 'Hello',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
    ],
  });

  assert.equal(result.success, true);
});

test('conversationSingleResponseSchema rejects missing data wrappers', () => {
  const result = conversationSingleResponseSchema.safeParse({
    id: 1,
    userId: 'user-1',
    title: 'Hello',
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-10T00:00:00.000Z',
  });

  assert.equal(result.success, false);
});
