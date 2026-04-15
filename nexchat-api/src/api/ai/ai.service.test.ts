import assert from 'node:assert/strict';
import test from 'node:test';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '@/db/schema';

import { resolveAiConversation } from './ai.service';

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

    INSERT INTO user (id) VALUES ('user-1');
    INSERT INTO user (id) VALUES ('user-2');
    INSERT INTO conversation (id, user_id, title, created_at, updated_at)
    VALUES (1, 'user-1', 'Existing Chat', 1, 1);
    INSERT INTO conversation (id, user_id, title, created_at, updated_at)
    VALUES (2, 'user-2', 'Other User Chat', 1, 1);
  `);

  return {
    database: drizzle(sqlite, { schema }),
    sqlite,
  };
}

test('resolveAiConversation creates a conversation when conversationId is missing', async () => {
  const { database, sqlite } = createTestDatabase();

  const result = await resolveAiConversation(
    {
      userId: 'user-1',
      content: 'abcdefghijabcdefghijz',
    },
    database
  );

  sqlite.close();

  assert.equal(result.ok, true);
  assert.equal(result.created, true);
  assert.equal(result.conversation.userId, 'user-1');
  assert.equal(result.conversation.title, 'abcdefghijabcdefghij');
});

test('resolveAiConversation reuses the requested conversation for the owner', async () => {
  const { database, sqlite } = createTestDatabase();

  const result = await resolveAiConversation(
    {
      userId: 'user-1',
      conversationId: 1,
      content: 'hello',
    },
    database
  );

  sqlite.close();

  assert.equal(result.ok, true);
  assert.equal(result.created, false);
  assert.equal(result.conversation.id, 1);
  assert.equal(result.conversation.title, 'Existing Chat');
});

test('resolveAiConversation rejects conversations owned by another user', async () => {
  const { database, sqlite } = createTestDatabase();

  const result = await resolveAiConversation(
    {
      userId: 'user-1',
      conversationId: 2,
      content: 'hello',
    },
    database
  );

  sqlite.close();

  assert.equal(result.ok, false);
  assert.equal(result.status, 403);
  assert.equal(result.message, 'Unauthorized');
});
