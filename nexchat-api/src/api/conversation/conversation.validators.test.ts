import assert from 'node:assert/strict';
import test from 'node:test';

import { idParamSchema } from '@/validator/index';

import {
  createConversationBodySchema,
  updateConversationBodySchema,
} from './conversation.validators';

test('conversation id param accepts positive integers', () => {
  const result = idParamSchema.safeParse({
    id: '42',
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.deepEqual(result.data, { id: 42 });
});

test('createConversationBodySchema rejects client supplied userId', () => {
  const result = createConversationBodySchema.safeParse({
    userId: 'user-1',
    title: 'Hello',
  });

  assert.equal(result.success, false);
});

test('createConversationBodySchema accepts title only', () => {
  const result = createConversationBodySchema.safeParse({
    title: 'Hello',
  });

  assert.equal(result.success, true);
});

test('updateConversationBodySchema rejects empty objects', () => {
  const result = updateConversationBodySchema.safeParse({});

  assert.equal(result.success, false);
});

test('updateConversationBodySchema accepts a valid title', () => {
  const result = updateConversationBodySchema.safeParse({
    title: 'Updated title',
  });

  assert.equal(result.success, true);
});
