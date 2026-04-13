import { describe, expect, it, vi } from 'vitest';

import { createLoadEvent, jsonResponse } from '$lib/test/http';
import { load } from './+page.server';

describe('login route load', () => {
  it('redirects authenticated users to /app', async () => {
    await expect(
      load(
        createLoadEvent({
          path: '/',
          fetch: vi.fn().mockResolvedValue(
            jsonResponse({ user: { email: 'user@example.com' } }, { status: 200 })
          )
        })
      )
    ).rejects.toMatchObject({ location: '/app', status: 303 });
  });

  it('returns normally when the auth server is unreachable', async () => {
    await expect(
      load(
        createLoadEvent({
          path: '/',
          fetch: vi.fn().mockRejectedValue(new TypeError('fetch failed'))
        })
      )
    ).resolves.toEqual({});
  });
});
