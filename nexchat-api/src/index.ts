import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello from Hono + TypeScript!');
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
