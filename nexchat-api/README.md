# NexChat API

`nexchat-api` is the backend service for NexChat. It handles authentication, conversations, messages, and AI chat endpoints.

## Tech Stack

- Node.js
- TypeScript
- Hono
- `@hono/zod-openapi`
- Better Auth
- Drizzle ORM
- SQLite (`better-sqlite3`)
- Zod

## API Organization

- Base prefix: `/api/v1`
- Auth prefix: `/api/v1/auth`
- OpenAPI spec: `/openapi.json`
- Docs page: `/docs`

Current core modules:

- `AI`
- `Conversations`
- `Messages`
- `Auth`

## Local Development

```sh
pnpm install
pnpm dev
```

Default service URL: `http://localhost:6001`

## Common Commands

```sh
pnpm dev
pnpm test
pnpm build
pnpm db:generate
pnpm db:migrate
```

## Environment Configuration

Key environment variables are defined in `src/config.ts`, including:

- `APP_BASE_URL`
- `WEB_APP_ORIGIN`
- `AI_PROVIDER`
- `AI_MODEL`
- `OLLAMA_BASE_URL`

If they are not set, the project falls back to local development defaults.
