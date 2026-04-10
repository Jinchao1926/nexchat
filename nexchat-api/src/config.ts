import process from 'node:process';

process.loadEnvFile();

export const API_PREFIX = '/api/v1';
export const AUTH_PREFIX =
  process.env.BETTER_AUTH_BASE_PATH ?? `${API_PREFIX}/auth`;
export const APP_BASE_URL =
  process.env.BETTER_AUTH_URL ?? 'http://localhost:6001';
export const WEB_APP_ORIGIN =
  process.env.WEB_APP_ORIGIN ?? 'http://localhost:5173';
export const BETTER_AUTH_TRUSTED_ORIGINS = Array.from(
  new Set(
    [
      WEB_APP_ORIGIN,
      ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? []),
    ]
      .map((origin) => origin.trim())
      .filter(Boolean)
  )
);
