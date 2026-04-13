import { describe, expect, it, vi } from 'vitest';

import { load } from './+page.server';

function createLoadEvent(fetch: typeof globalThis.fetch) {
  return {
    fetch,
    request: new Request('http://localhost:5173/app')
  } as Parameters<typeof load>[0];
}

describe('/app route load', () => {
  it('redirects anonymous users back to /', async () => {
    await expect(
      load(createLoadEvent(vi.fn().mockResolvedValue(new Response(null, { status: 401 })) as typeof globalThis.fetch))
    ).rejects.toMatchObject({ location: '/', status: 303 });
  });

  it('redirects to / when the auth server is unreachable', async () => {
    await expect(
      load(createLoadEvent(vi.fn().mockRejectedValue(new TypeError('fetch failed')) as typeof globalThis.fetch))
    ).rejects.toMatchObject({ location: '/', status: 303 });
  });
});
