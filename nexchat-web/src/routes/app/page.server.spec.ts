import { describe, expect, it, vi } from 'vitest';

import { load } from './+page.server';

describe('/app route load', () => {
  it('redirects anonymous users back to /', async () => {
    await expect(
      load({
        fetch: vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
        request: new Request('http://localhost:5173/app')
      } as never)
    ).rejects.toMatchObject({ location: '/', status: 303 });
  });
});
