# NexChat Web

## Local development

1. Start the API server:

   ```sh
   pnpm --dir ../nexchat-api dev
   ```

2. Start the web app:

   ```sh
   pnpm dev
   ```

## Auth flow

- `/` shows the login page
- `/app` is protected and requires a valid auth session
- The web app expects the auth server at `http://localhost:6001`
- Email/password sign-in and sign-up both use the existing `better-auth` backend
