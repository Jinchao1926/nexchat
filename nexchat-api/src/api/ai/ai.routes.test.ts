import assert from 'node:assert/strict';
import test from 'node:test';

import { Hono } from 'hono';

import conversationRoutes from '@/api/conversation';

import { streamAiChatHandler } from './ai.handlers';

test('ai.handlers exports the stream handler', () => {
  assert.equal(typeof streamAiChatHandler, 'function');
});

test('POST /api/v1/conversations/:id/ai/stream requires a session', async () => {
  const app = new Hono();
  app.route('/api/v1/conversations', conversationRoutes);

  const response = await app.request('/api/v1/conversations/1/ai/stream', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      content: '你好',
    }),
  });

  assert.equal(response.status, 401);
});
