import { describe, expect, it, vi } from 'vitest';

import { load } from './+page.server';

function createLoadEvent(fetch: typeof globalThis.fetch) {
  return {
    fetch,
    request: new Request('http://localhost:5173/')
  } as Parameters<typeof load>[0];
}

describe('login route load', () => {
  it('redirects authenticated users to /app', async () => {
    await expect(
      load(
        createLoadEvent(
          vi.fn().mockResolvedValue(
            Response.json({ user: { email: 'user@example.com' } }, { status: 200 })
          ) as typeof globalThis.fetch
        )
      )
    ).rejects.toMatchObject({ location: '/app', status: 303 });
  });

  it('returns normally when the auth server is unreachable', async () => {
    await expect(
      load(createLoadEvent(vi.fn().mockRejectedValue(new TypeError('fetch failed')) as typeof globalThis.fetch))
    ).resolves.toEqual({});
  });
});
