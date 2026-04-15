import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { user } from './auth';
import { conversation } from './conversation';

export const message = sqliteTable('message', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversation.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  status: text('status', {
    enum: ['pending', 'streaming', 'completed', 'failed'],
  })
    .default('completed')
    .notNull(),
  provider: text('provider'),
  model: text('model'),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
