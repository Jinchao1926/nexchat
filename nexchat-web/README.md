# NexChat Web

`nexchat-web` is the web client for NexChat. It is built with SvelteKit and handles login, conversation lists, message display, and chat interactions.

## Tech Stack

- SvelteKit
- Svelte 5 (runes mode)
- Vite
- TypeScript
- Tailwind CSS 4
- Flowbite Svelte
- Vitest
- Playwright

## Running Locally

Start the API first:

```sh
pnpm --dir ../nexchat-api dev
```

Then start the web app:

```sh
pnpm install
pnpm dev
```

Default URL: `http://localhost:5173`

## Backend Integration

- Login page: `/`
- Chat page: `/app`
- Depends on backend auth and conversation APIs
- Default API base URL: `http://localhost:6001/api/v1`
- Default auth server URL: `http://localhost:6001`

## Common Commands

```sh
pnpm dev
pnpm check
pnpm test
pnpm build
```
