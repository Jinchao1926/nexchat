import { PUBLIC_API_BASE_URL } from '$env/static/public';

const DEFAULT_API_BASE_URL = 'http://localhost:6001/api/v1';

export const API_BASE_URL = PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
export const API_SERVER_URL = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');
export const AUTH_BASE_URL = `${API_BASE_URL.replace(/\/$/, '')}/auth`;
