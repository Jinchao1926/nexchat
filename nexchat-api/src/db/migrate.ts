import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { createSqlite, getMigrationsPath } from './index';

const sqlite = createSqlite();

try {
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: getMigrationsPath() });
  console.log('Migrations applied successfully.');
} finally {
  sqlite.close();
}
