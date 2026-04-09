import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getSession, signIn } from './api';

describe('auth api', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('posts credentials to the sign-in endpoint with credentials included', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ token: 'ok' }), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);

		const result = await signIn(
			{ email: 'user@example.com', password: '123456' },
			fetchMock as typeof fetch
		);

		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:6001/api/v1/auth/sign-in/email',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include'
			})
		);
		expect(result.error).toBeNull();
	});

	it('normalizes unreachable server errors', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));

		const result = await getSession(fetchMock as typeof fetch);

		expect(result).toEqual({
			data: null,
			error: 'Auth server is unavailable at http://localhost:6001'
		});
	});
});
