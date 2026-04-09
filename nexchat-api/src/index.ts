import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import conversationRoutes from '@/api/conversation';
import { auth } from '@/lib/auth';

const app = new Hono();
app.on(['POST', 'GET'], '/api/v1/auth/*', (c) => auth.handler(c.req.raw));

app.route('/api/v1/conversations', conversationRoutes);

app.get('/', (c) => {
  return c.text('Hello from NexChat!');
});

serve(
  {
    fetch: app.fetch,
    port: 6001,
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  }
);
