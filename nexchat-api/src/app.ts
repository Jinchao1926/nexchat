import { Hono } from 'hono';
import { cors } from 'hono/cors';

import conversationRoutes from '@/api/conversation';
import { auth } from '@/lib/auth';

const app = new Hono();

app.use(
  '/api/v1/auth/*',
  cors({
    origin: 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    credentials: true,
  })
);

app.on(['POST', 'GET', 'OPTIONS'], '/api/v1/auth/*', (c) => auth.handler(c.req.raw));

app.route('/api/v1/conversations', conversationRoutes);

app.get('/', (c) => {
  return c.text('Hello from NexChat!');
});

export default app;
