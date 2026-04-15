import assert from 'node:assert/strict';
import test from 'node:test';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '@/db/schema';

import {
  createMessage,
  listRecentCompletedMessagesByConversationId,
  updateMessageStatus,
} from './message.service';

function createTestDatabase() {
  const sqlite = new Database(':memory:');

  sqlite.exec(`
    CREATE TABLE user (
      id text PRIMARY KEY
    );

    CREATE TABLE conversation (
      id integer PRIMARY KEY AUTOINCREMENT,
      user_id text NOT NULL,
      title text NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE message (
      id integer PRIMARY KEY AUTOINCREMENT,
      conversation_id integer NOT NULL,
      user_id text NOT NULL,
      role text NOT NULL,
      content text NOT NULL,
      status text DEFAULT 'completed' NOT NULL,
      provider text,
      model text,
      error text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );

    INSERT INTO user (id) VALUES ('user-1');
    INSERT INTO conversation (id, user_id, title, created_at, updated_at)
    VALUES (1, 'user-1', 'AI Chat', 1, 1);
  `);

  return {
    database: drizzle(sqlite, { schema }),
    sqlite,
  };
}

test('createMessage persists AI metadata', async () => {
  const { database, sqlite } = createTestDatabase();

  const created = await createMessage(
    {
      conversationId: 1,
      userId: 'user-1',
      role: 'assistant',
      content: '',
      status: 'streaming',
      provider: 'ollama',
      model: 'qwen2.5:3b',
    },
    database
  );

  sqlite.close();

  assert.equal(created?.status, 'streaming');
  assert.equal(created?.provider, 'ollama');
  assert.equal(created?.model, 'qwen2.5:3b');
  assert.equal(created?.error, null);
});

test('listRecentCompletedMessagesByConversationId returns completed messages in ascending order', async () => {
  const { database, sqlite } = createTestDatabase();

  await createMessage(
    {
      conversationId: 1,
      userId: 'user-1',
      role: 'user',
      content: 'first',
      status: 'completed',
    },
    database
  );
  await createMessage(
    {
      conversationId: 1,
      userId: 'user-1',
      role: 'assistant',
      content: 'skip streaming',
      status: 'streaming',
    },
    database
  );
  await createMessage(
    {
      conversationId: 1,
      userId: 'user-1',
      role: 'assistant',
      content: 'second',
      status: 'completed',
    },
    database
  );

  const messages = listRecentCompletedMessagesByConversationId(1, 20, database);
  sqlite.close();

  assert.deepEqual(
    messages.map((message) => message.content),
    ['first', 'second']
  );
});

test('updateMessageStatus updates streamed assistant content and status', async () => {
  const { database, sqlite } = createTestDatabase();
  const created = await createMessage(
    {
      conversationId: 1,
      userId: 'user-1',
      role: 'assistant',
      content: '',
      status: 'streaming',
    },
    database
  );

  assert.ok(created);

  const updated = await updateMessageStatus(
    created.id,
    {
      content: 'done',
      status: 'completed',
      error: null,
    },
    database
  );
  sqlite.close();

  assert.equal(updated?.content, 'done');
  assert.equal(updated?.status, 'completed');
  assert.equal(updated?.error, null);
});
