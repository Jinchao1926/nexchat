import assert from 'node:assert/strict';
import test from 'node:test';

import { Hono } from 'hono';

import conversationRoutes from '@/api/conversation';
import {
  createMessageHandler,
  deleteMessageHandler,
  getMessageHandler,
  listMessagesHandler,
  updateMessageHandler,
} from './message.handlers';

test('message.handlers exports the public route handlers', () => {
  assert.equal(typeof listMessagesHandler, 'function');
  assert.equal(typeof getMessageHandler, 'function');
  assert.equal(typeof createMessageHandler, 'function');
  assert.equal(typeof updateMessageHandler, 'function');
  assert.equal(typeof deleteMessageHandler, 'function');
});

test('GET /api/v1/conversations/:id/messages matches nested message route', async () => {
  const app = new Hono();
  app.route('/api/v1/conversations', conversationRoutes);

  const response = await app.request('/api/v1/conversations/1/messages');

  assert.equal(response.status, 401);
});

test('GET /api/v1/conversations/:id/messages/:messageId matches nested message route', async () => {
  const app = new Hono();
  app.route('/api/v1/conversations', conversationRoutes);

  const response = await app.request('/api/v1/conversations/1/messages/2');

  assert.equal(response.status, 401);
});

test('DELETE /api/v1/conversations/:id/messages/:messageId still requires a session after handler extraction', async () => {
  const app = new Hono();
  app.route('/api/v1/conversations', conversationRoutes);

  const response = await app.request('/api/v1/conversations/1/messages/2', {
    method: 'DELETE',
  });

  assert.equal(response.status, 401);
});
