import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  nickname: text('nickname').notNull(),
  // 每次插入时动态生成一个时间戳，表示创建时间
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),

  // 建表时固定一个时间，永远不变
  // createdAt: integer('created_at').notNull().default(Date.now()),
});
