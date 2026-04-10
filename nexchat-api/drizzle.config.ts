import { fileURLToPath } from 'node:url';

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: fileURLToPath(new URL('./database.db', import.meta.url)),
  },
});
