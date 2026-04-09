import type { Context, MiddlewareHandler } from 'hono';

import { auth } from '@/lib/auth';

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type SessionUser = AuthSession['user'];
export type SessionData = AuthSession['session'];

declare module 'hono' {
  interface ContextVariableMap {
    user: SessionUser;
    session: SessionData;
  }
}

export const requireSession: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  c.set('session', session.session);

  await next();
};

export function getSessionUser(c: Context): SessionUser {
  return c.get('user');
}
