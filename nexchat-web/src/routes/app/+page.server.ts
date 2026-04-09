import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { AUTH_BASE_URL } from '$lib/auth/config';

export const load: PageServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie');
	const response = await fetch(`${AUTH_BASE_URL}/get-session`, {
		method: 'GET',
		headers: cookie ? { cookie } : {}
	});

	if (!response.ok) {
		throw redirect(303, '/');
	}

	const session = await response.json();

	if (!session?.user) {
		throw redirect(303, '/');
	}

	return { session };
};
