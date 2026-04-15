import process from 'node:process';

process.loadEnvFile();

function getEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export const API_PREFIX = '/api/v1';
export const AUTH_PREFIX = `${API_PREFIX}/auth`;
export const APP_BASE_URL = getEnv('APP_BASE_URL', 'http://localhost:6001');
export const WEB_APP_ORIGIN = getEnv(
  'WEB_APP_ORIGIN',
  'http://localhost:5173'
);
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
export const AI_PROVIDER = getEnv('AI_PROVIDER', 'ollama');
export const AI_MODEL = getEnv('AI_MODEL', 'qwen3.5:latest');
export const OLLAMA_BASE_URL = getEnv(
  'OLLAMA_BASE_URL',
  'http://localhost:11434'
);
export const AI_SYSTEM_PROMPT = getEnv(
  'AI_SYSTEM_PROMPT',
  'You are NexChat assistant. Answer clearly and concisely in the same language as the user.'
);
