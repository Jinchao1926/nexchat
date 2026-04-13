import { createApiClient } from '$lib/api/core/client';
import { AUTH_BASE_URL, API_SERVER_URL } from '$lib/api/core/config';
import type { ApiContext } from '$lib/api/core/types';

export const AUTH_SERVER_UNAVAILABLE_MESSAGE = `Auth server is unavailable at ${API_SERVER_URL}`;

const authClient = createApiClient({ baseUrl: AUTH_BASE_URL });

export function getAuthClient(context?: ApiContext) {
  if (!context) {
    return authClient;
  }

  if (typeof context === 'function') {
    return createApiClient({ baseUrl: AUTH_BASE_URL, fetch: context });
  }

  return createApiClient({
    baseUrl: AUTH_BASE_URL,
    fetch: context.fetch,
    request: context.request
  });
}
