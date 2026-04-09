import assert from 'node:assert/strict';
import test from 'node:test';

import app from '.';

test('GET /conversations requires a session', async () => {
  const response = await app.request('/');

  assert.equal(response.status, 401);
});

test('POST /conversations requires a session', async () => {
  const response = await app.request('/', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Hello',
    }),
  });

  assert.equal(response.status, 401);
});
