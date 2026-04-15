import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

import {
  APP_BASE_URL,
  AI_MODEL,
  AI_PROVIDER,
  AI_SYSTEM_PROMPT,
  AUTH_PREFIX,
  BETTER_AUTH_TRUSTED_ORIGINS,
  OLLAMA_BASE_URL,
  WEB_APP_ORIGIN,
} from './config';

test('app config derives auth defaults from base settings', () => {
  assert.equal(APP_BASE_URL, process.env.APP_BASE_URL ?? 'http://localhost:6001');
  assert.equal(AUTH_PREFIX, '/api/v1/auth');
  assert.equal(
    WEB_APP_ORIGIN,
    process.env.WEB_APP_ORIGIN ?? 'http://localhost:5173'
  );
  assert.ok(BETTER_AUTH_TRUSTED_ORIGINS.includes(WEB_APP_ORIGIN));
});

test('config ignores legacy Better Auth env overrides', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--import',
      'tsx',
      '--eval',
      `
      const { APP_BASE_URL, AUTH_PREFIX } = require('./src/config.ts');
      console.log(JSON.stringify({ APP_BASE_URL, AUTH_PREFIX }));
      `,
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        APP_BASE_URL: '',
        BETTER_AUTH_URL: 'http://legacy.example',
        BETTER_AUTH_BASE_PATH: '/legacy/auth',
      },
      encoding: 'utf8',
    }
  );

  const parsed = JSON.parse(output) as {
    APP_BASE_URL: string;
    AUTH_PREFIX: string;
  };

  assert.equal(parsed.APP_BASE_URL, 'http://localhost:6001');
  assert.equal(parsed.AUTH_PREFIX, '/api/v1/auth');
});

test('AI config exposes free local defaults', () => {
  assert.equal(AI_PROVIDER, process.env.AI_PROVIDER ?? 'ollama');
  assert.equal(AI_MODEL, process.env.AI_MODEL ?? 'qwen3.5:latest');
  assert.equal(
    OLLAMA_BASE_URL,
    process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  );
  assert.ok(AI_SYSTEM_PROMPT.length > 0);
});
