import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 20;
export const NICKNAME_MIN_LENGTH = 3;
export const NICKNAME_MAX_LENGTH = 20;

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    nickname: text('nickname').notNull(),
    // Dynamic default value that generates a timestamp at insertion time
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),

    // Fixed default value set at table creation time, never changes
    // createdAt: integer('created_at').notNull().default(Date.now()),
  },
  (table) => [
    check(
      'username_length',
      sql`length(${table.username}) between ${sql.raw(String(USERNAME_MIN_LENGTH))} and ${sql.raw(String(USERNAME_MAX_LENGTH))}`
    ),
    check(
      'nickname_length',
      sql`length(${table.nickname}) between ${sql.raw(String(NICKNAME_MIN_LENGTH))} and ${sql.raw(String(NICKNAME_MAX_LENGTH))}`
    ),
  ]
);
