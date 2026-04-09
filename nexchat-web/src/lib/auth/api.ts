import { AUTH_BASE_URL, AUTH_SERVER_UNAVAILABLE_MESSAGE } from './config';

export type AuthPayload = {
	email: string;
	password: string;
	name?: string;
};

export type AuthResult<T> = {
	data: T | null;
	error: string | null;
};

async function request<T>(
	path: string,
	init: RequestInit,
	fetchImpl: typeof fetch = fetch
): Promise<AuthResult<T>> {
	try {
		const response = await fetchImpl(`${AUTH_BASE_URL}${path}`, {
			...init,
			credentials: 'include',
			headers: {
				'content-type': 'application/json',
				...(init.headers ?? {})
			}
		});

		const isJson = response.headers.get('content-type')?.includes('application/json');
		const payload = isJson ? await response.json() : null;

		if (!response.ok) {
			const message =
				payload &&
				typeof payload === 'object' &&
				'message' in payload &&
				typeof payload.message === 'string'
					? payload.message
					: 'Authentication failed';

			return { data: null, error: message };
		}

		return { data: payload as T, error: null };
	} catch {
		return { data: null, error: AUTH_SERVER_UNAVAILABLE_MESSAGE };
	}
}

export function signIn(payload: AuthPayload, fetchImpl?: typeof fetch) {
	return request('/sign-in/email', {
		method: 'POST',
		body: JSON.stringify(payload)
	}, fetchImpl);
}

export function signUp(payload: AuthPayload, fetchImpl?: typeof fetch) {
	return request('/sign-up/email', {
		method: 'POST',
		body: JSON.stringify(payload)
	}, fetchImpl);
}

export function signOut(fetchImpl?: typeof fetch) {
	return request('/sign-out', { method: 'POST' }, fetchImpl);
}

export function getSession(fetchImpl?: typeof fetch) {
	return request('/get-session', { method: 'GET' }, fetchImpl);
}
