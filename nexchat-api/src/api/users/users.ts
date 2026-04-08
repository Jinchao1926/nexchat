import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { db } from '../../db';
import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  users,
} from '../../db/schema';

const app = new Hono();

const userSchema = z.object({
  username: z.string().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  nickname: z.string().min(NICKNAME_MIN_LENGTH).max(NICKNAME_MAX_LENGTH),
});

app.get('/', async (c) => {
  const list = db.select().from(users).all();
  return c.json({ message: 'ok', users: list });
});

app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid user id' }, 400);
  }

  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }
  return c.json({ message: 'ok', user });
});

app.post('/', zValidator('json', userSchema), async (c) => {
  const data = c.req.valid('json');
  const [created] = await db.insert(users).values(data).returning();
  return c.json({ message: 'ok', user: created }, 201);
});

app.put('/:id', zValidator('json', userSchema.partial()), async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid user id' }, 400);
  }

  const data = c.req.valid('json');
  const [updated] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();

  if (!updated) {
    return c.json({ message: 'User not found' }, 404);
  }
  return c.json({ message: 'ok', user: updated });
});

app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isSafeInteger(id) || id <= 0) {
    return c.json({ message: 'Invalid user id' }, 400);
  }

  const deleted = await db.delete(users).where(eq(users.id, id)).run();
  if (!deleted) {
    return c.json({ message: 'User not found' }, 404);
  }
  return c.json({ message: 'ok' });
});

export default app;
