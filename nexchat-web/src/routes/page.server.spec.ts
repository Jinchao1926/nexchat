import { describe, expect, it, vi } from 'vitest';

import { load } from './+page.server';

describe('login route load', () => {
	it('redirects authenticated users to /app', async () => {
		await expect(
			load({
				fetch: vi.fn().mockResolvedValue(
					new Response(JSON.stringify({ user: { email: 'user@example.com' } }), {
						status: 200,
						headers: { 'content-type': 'application/json' }
					})
				),
				request: new Request('http://localhost:5173/')
			} as never)
		).rejects.toMatchObject({ location: '/app', status: 303 });
	});
});
