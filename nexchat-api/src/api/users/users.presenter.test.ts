import assert from 'node:assert/strict';
import test from 'node:test';

import { serializeUser, serializeUsers } from './users.presenter';

test('serializeUser removes the stored passwordHash field', () => {
  const user = {
    id: 1,
    username: 'tester',
    passwordHash: 'stored-hash',
    nickname: 'Tester',
    createdAt: 1,
  };

  assert.deepEqual(serializeUser(user), {
    id: 1,
    username: 'tester',
    nickname: 'Tester',
    createdAt: 1,
  });
});

test('serializeUsers removes passwords from every user', () => {
  const users = [
    {
      id: 1,
      username: 'tester',
      passwordHash: 'stored-hash',
      nickname: 'Tester',
      createdAt: 1,
    },
  ];

  assert.deepEqual(serializeUsers(users), [
    {
      id: 1,
      username: 'tester',
      nickname: 'Tester',
      createdAt: 1,
    },
  ]);
});
