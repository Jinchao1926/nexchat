import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';

import { db } from '@/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 开发环境关闭
    minPasswordLength: 6,
  },
  plugins: [
    openAPI({
      path: '/reference',
      disableDefaultReference: true,
    }),
  ],
});
