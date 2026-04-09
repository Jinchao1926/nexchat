import { serve } from '@hono/node-server';

import app from './app';

serve(
  {
    fetch: app.fetch,
    port: 6001,
  },
  (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  }
);
