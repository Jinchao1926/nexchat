import assert from 'node:assert/strict';
import test from 'node:test';

import app from '.';

test('POST /users rejects usernames longer than the schema limit', async () => {
  const response = await app.request('/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      username: 'a'.repeat(21),
      password: 'secret123',
      nickname: 'tester',
    }),
  });

  assert.equal(response.status, 400);

  const body = (await response.json()) as {
    message?: string;
    errors?: Array<{ path?: string[] }>;
  };

  assert.equal(body.message, 'Invalid user payload');
  assert.deepEqual(body.errors?.[0]?.path, ['username']);
});
