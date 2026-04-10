import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';

import {
  APP_BASE_URL,
  AUTH_PREFIX,
  BETTER_AUTH_TRUSTED_ORIGINS,
} from '@/config';
import { db } from '@/db';

export const auth = betterAuth({
  basePath: AUTH_PREFIX,
  baseURL: APP_BASE_URL,
  trustedOrigins: BETTER_AUTH_TRUSTED_ORIGINS,
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
