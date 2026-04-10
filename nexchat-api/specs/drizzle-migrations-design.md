# Drizzle Migration Setup Design

## Goal

Add a standard Drizzle migration workflow for `nexchat-api` using SQL migration files in `nexchat-api/drizzle/`, while keeping the existing schema files in `nexchat-api/src/db/schema/` as the source of truth.

## Scope

- Add `drizzle.config.ts` for SQLite + Drizzle Kit.
- Add a migration runner in `src/db/migrate.ts`.
- Add package scripts for generating and applying migrations.
- Keep database path consistent with the runtime DB path.

## Architecture

- `src/db/schema/*.ts` remains the schema definition source.
- `drizzle.config.ts` points Drizzle Kit to `src/db/schema/index.ts` and outputs SQL migrations to `drizzle/`.
- `src/db/index.ts` continues to own runtime DB creation and database path resolution.
- `src/db/migrate.ts` reuses the same DB path and applies migrations from the generated `drizzle/` folder.

## File Layout

- `nexchat-api/drizzle.config.ts`
- `nexchat-api/src/db/migrate.ts`
- generated SQL files under `nexchat-api/drizzle/`
- updated npm scripts in `nexchat-api/package.json`

## Data Flow

1. Developer updates schema files.
2. Developer runs `npm run db:generate`.
3. Drizzle Kit compares schema and emits SQL migration files into `drizzle/`.
4. Developer runs `npm run db:migrate`.
5. The migration runner opens the same SQLite database file used by the app and applies pending SQL migrations.

## Error Handling

- Migration runner should fail fast and exit non-zero if migration application fails.
- Database path resolution should remain centralized so generation/runtime/migration do not drift.

## Testing and Verification

- TypeScript build must pass.
- Migration runner should type-check and use the same DB path helper as runtime DB setup.
- Package scripts should be runnable from `nexchat-api/`.

## Trade-offs

- Using standard SQL files is more explicit and reviewable than auto-sync approaches.
- A separate migration runner adds one small file, but avoids mixing app startup with schema changes.
