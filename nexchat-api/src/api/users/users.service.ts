import { eq } from 'drizzle-orm';

import { db } from '../../db';
import { users } from '../../db/schema';
import { hashPassword } from './password';
import type { CreateUserBody, UpdateUserBody } from './users.validators';

type DatabaseClient = typeof db;
type UserRecord = typeof users.$inferSelect;

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super('Username already exists');
    this.name = 'UsernameTakenError';
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}

export function listUsers(database: DatabaseClient = db) {
  return database.select().from(users).all();
}

export function getUserById(id: number, database: DatabaseClient = db) {
  const user = database.select().from(users).where(eq(users.id, id)).get();

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
}

export async function createUser(
  input: CreateUserBody,
  database: DatabaseClient = db
) {
  try {
    const [created] = await database
      .insert(users)
      .values({
        username: input.username,
        nickname: input.nickname,
        passwordHash: hashPassword(input.password),
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create user');
    }

    return created;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new UsernameTakenError();
    }

    throw error;
  }
}

function buildUserUpdate(input: UpdateUserBody) {
  const updateData: Partial<UserRecord> = {};

    if (input.username !== undefined) {
      updateData.username = input.username;
    }

    if (input.nickname !== undefined) {
      updateData.nickname = input.nickname;
    }

  if (input.password) {
    updateData.passwordHash = hashPassword(input.password);
  }

  return updateData;
}

export async function updateUser(
  id: number,
  input: UpdateUserBody,
  database: DatabaseClient = db
) {
  try {
    const [updated] = await database
      .update(users)
      .set(buildUserUpdate(input))
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new UserNotFoundError();
    }

    return updated;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new UsernameTakenError();
    }

    throw error;
  }
}

export async function deleteUser(id: number, database: DatabaseClient = db) {
  const deleted = await database.delete(users).where(eq(users.id, id)).run();

  if (deleted.changes === 0) {
    throw new UserNotFoundError();
  }
}
