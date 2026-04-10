import assert from 'node:assert/strict';
import test from 'node:test';

import app from '.';
import {
  createConversationHandler,
  deleteConversationHandler,
  getConversationHandler,
  listConversationsHandler,
  updateConversationHandler,
} from './conversation.handlers';

test('conversation.handlers exports the public route handlers', () => {
  assert.equal(typeof listConversationsHandler, 'function');
  assert.equal(typeof getConversationHandler, 'function');
  assert.equal(typeof createConversationHandler, 'function');
  assert.equal(typeof updateConversationHandler, 'function');
  assert.equal(typeof deleteConversationHandler, 'function');
});

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

test('GET /conversations/:id still requires a session after handler extraction', async () => {
  const response = await app.request('/1');

  assert.equal(response.status, 401);
});

test('DELETE /conversations/:id still requires a session after handler extraction', async () => {
  const response = await app.request('/1', { method: 'DELETE' });

  assert.equal(response.status, 401);
});
