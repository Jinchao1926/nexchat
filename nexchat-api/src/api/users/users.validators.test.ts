import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createUserBodySchema,
  updateUserBodySchema,
  userIdParamSchema,
} from './users.validators';

test('userIdParamSchema parses positive integer route params', () => {
  const result = userIdParamSchema.safeParse({ id: '42' });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.deepEqual(result.data, { id: 42 });
});

test('userIdParamSchema rejects non-positive ids', () => {
  const result = userIdParamSchema.safeParse({ id: '0' });

  assert.equal(result.success, false);
});

test('updateUserBodySchema rejects empty objects', () => {
  const result = updateUserBodySchema.safeParse({});

  assert.equal(result.success, false);
});

test('createUserBodySchema trims username and nickname', () => {
  const result = createUserBodySchema.safeParse({
    username: '  tester  ',
    password: 'secret123',
    nickname: '  Tester  ',
  });

  assert.equal(result.success, true);
  if (!result.success) {
    return;
  }

  assert.deepEqual(result.data, {
    username: 'tester',
    password: 'secret123',
    nickname: 'Tester',
  });
});
