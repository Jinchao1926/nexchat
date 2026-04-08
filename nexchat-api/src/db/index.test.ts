import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import packageJson from '../../package.json' with { type: 'json' };

import * as dbModule from './index';
import * as usersModule from './schema/users';

const dbExports = ((dbModule as { default?: unknown }).default ?? dbModule) as {
  getDatabasePath?: () => string;
  getMigrationsPath?: () => string;
  createSqlite?: (databasePath?: string) => unknown;
};
const schemaExports = ((usersModule as { default?: unknown }).default ??
  usersModule) as {
  users: {
    passwordHash?: unknown;
    password?: unknown;
    createdAt: { defaultFn?: () => number; default?: unknown };
  };
};

test('users schema stores hashed passwords in passwordHash', () => {
  assert.notEqual(schemaExports.users.passwordHash, undefined);
  assert.equal(schemaExports.users.password, undefined);
});

test('getDatabasePath returns an absolute project-local sqlite path', () => {
  assert.equal(typeof dbExports.getDatabasePath, 'function');

  const databasePath = dbExports.getDatabasePath!();

  assert.equal(path.isAbsolute(databasePath), true);
  assert.equal(path.basename(databasePath), 'database.db');
  assert.equal(
    databasePath.includes(`${path.sep}nexchat-api${path.sep}`),
    true
  );
});

test('users.createdAt uses a dynamic default function', async () => {
  assert.equal(typeof schemaExports.users.createdAt.defaultFn, 'function');

  const first = schemaExports.users.createdAt.defaultFn!();
  await new Promise((resolve) => setTimeout(resolve, 5));
  const second = schemaExports.users.createdAt.defaultFn!();

  assert.equal(typeof first, 'number');
  assert.equal(typeof second, 'number');
  assert.notEqual(first, second);
  assert.equal(schemaExports.users.createdAt.default, undefined);
});

test('getMigrationsPath returns an absolute drizzle directory path', () => {
  assert.equal(typeof dbExports.getMigrationsPath, 'function');

  const migrationsPath = dbExports.getMigrationsPath!();

  assert.equal(path.isAbsolute(migrationsPath), true);
  assert.equal(path.basename(migrationsPath), 'drizzle');
  assert.equal(
    migrationsPath.includes(`${path.sep}nexchat-api${path.sep}`),
    true
  );
});

test('createSqlite is available for the migration runner', () => {
  assert.equal(typeof dbExports.createSqlite, 'function');
});

test('package scripts expose drizzle generate and migrate commands', () => {
  assert.equal(packageJson.scripts['db:generate'], 'drizzle-kit generate');
  assert.equal(
    packageJson.scripts.test,
    'node --import tsx --test "src/**/*.test.ts"'
  );
  assert.equal(
    packageJson.scripts['db:migrate'],
    'node --import tsx src/db/migrate.ts'
  );
});

test('drizzle migrations directory exists after generation', () => {
  assert.equal(typeof dbExports.getMigrationsPath, 'function');
  assert.equal(fs.existsSync(dbExports.getMigrationsPath!()), true);
});

test('generated sqlite migration inlines check-constraint bounds', () => {
  assert.equal(typeof dbExports.getMigrationsPath, 'function');

  const migrationPath = path.join(
    dbExports.getMigrationsPath!(),
    '0000_unusual_gideon.sql'
  );
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  assert.equal(migrationSql.includes('between ? and ?'), false);
  assert.match(migrationSql, /between 3 and 20/);
});
