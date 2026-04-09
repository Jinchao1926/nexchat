import assert from 'node:assert/strict';
import test from 'node:test';

import { createMessageBodySchema } from './message.validators';

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
