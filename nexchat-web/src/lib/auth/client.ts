import type { ApiContext } from '$lib/api/core/types';
import type { AuthPayload, AuthResult } from './types';
import { AUTH_SERVER_UNAVAILABLE_MESSAGE, getAuthClient } from './core';

export async function signIn<T = unknown>(
  payload: AuthPayload,
  context?: ApiContext
): Promise<AuthResult<T>> {
  const client = getAuthClient(context);

  try {
    const { data, error } = await client.post<T>(
      '/sign-in/email',
      payload,
      'Authentication failed'
    );

    return { data, error };
  } catch {
    return { data: null, error: AUTH_SERVER_UNAVAILABLE_MESSAGE };
  }
}

export async function signUp<T = unknown>(
  payload: AuthPayload,
  context?: ApiContext
): Promise<AuthResult<T>> {
  const client = getAuthClient(context);

  try {
    const { data, error } = await client.post<T>(
      '/sign-up/email',
      payload,
      'Authentication failed'
    );

    return { data, error };
  } catch {
    return { data: null, error: AUTH_SERVER_UNAVAILABLE_MESSAGE };
  }
}

export async function signOut<T = unknown>(context?: ApiContext): Promise<AuthResult<T>> {
  const client = getAuthClient(context);

  try {
    const { data, error } = await client.post<T>('/sign-out', {}, 'Authentication failed');

    return { data, error };
  } catch {
    return { data: null, error: AUTH_SERVER_UNAVAILABLE_MESSAGE };
  }
}

export async function getSession<T = { user?: unknown }>(
  context?: ApiContext
): Promise<AuthResult<T>> {
  const client = getAuthClient(context);

  try {
    const { data, error } = await client.get<T>('/get-session', 'Authentication failed');

    return { data, error };
  } catch {
    return { data: null, error: AUTH_SERVER_UNAVAILABLE_MESSAGE };
  }
}
