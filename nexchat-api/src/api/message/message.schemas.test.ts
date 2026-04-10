import assert from 'node:assert/strict';
import test from 'node:test';

import {
  conversationMessageParamsSchema,
  createMessageBodySchema,
  updateMessageBodySchema,
} from './message.schemas';

test('conversationMessageParamsSchema accepts positive integer route params', () => {
  const result = conversationMessageParamsSchema.safeParse({
    id: '1',
    messageId: '42',
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.deepEqual(result.data, { id: 1, messageId: 42 });
});

test('createMessageBodySchema rejects client supplied userId', () => {
  const result = createMessageBodySchema.safeParse({
    userId: 'user-1',
    role: 'assistant',
    content: 'hello',
  });

  assert.equal(result.success, false);
});

test('createMessageBodySchema accepts role and content only', () => {
  const result = createMessageBodySchema.safeParse({
    role: 'assistant',
    content: 'hello',
  });

  assert.equal(result.success, true);
});

test('updateMessageBodySchema rejects empty objects', () => {
  const result = updateMessageBodySchema.safeParse({});

  assert.equal(result.success, false);
});

test('updateMessageBodySchema accepts content only', () => {
  const result = updateMessageBodySchema.safeParse({
    content: 'updated',
  });

  assert.equal(result.success, true);
});
