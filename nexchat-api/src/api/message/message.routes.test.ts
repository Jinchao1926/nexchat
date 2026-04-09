import assert from 'node:assert/strict';
import test from 'node:test';

import { Hono } from 'hono';

import conversationRoutes from '@/api/conversation';

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
