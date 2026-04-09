import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

export function getDatabasePath() {
  return fileURLToPath(new URL('../../database.db', import.meta.url));
}

export function getMigrationsPath() {
  return fileURLToPath(new URL('../../drizzle', import.meta.url));
}

export function createSqlite(
  databasePath = getDatabasePath()
): Database.Database {
  return new Database(databasePath);
}

const sqlite = createSqlite();
export const db = drizzle(sqlite, { schema });

export type DatabaseClient = typeof db;
