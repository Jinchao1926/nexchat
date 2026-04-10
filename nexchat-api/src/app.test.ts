import assert from 'node:assert/strict';
import test from 'node:test';

import app from './app';
import { APP_BASE_URL } from './config';

test('OPTIONS /api/v1/auth/sign-in/email returns CORS headers for the web app', async () => {
  assert.ok(process.env.WEB_APP_ORIGIN);

  const response = await app.request('/api/v1/auth/sign-in/email', {
    method: 'OPTIONS',
    headers: {
      origin: process.env.WEB_APP_ORIGIN,
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    process.env.WEB_APP_ORIGIN
  );
  assert.equal(
    response.headers.get('access-control-allow-credentials'),
    'true'
  );
});

test('POST /api/v1/auth/sign-up/email is handled by Better Auth', async () => {
  const response = await app.request('/api/v1/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: 'route-check@example.com',
      password: '123',
      name: 'Route Check',
    }),
  });

  assert.notEqual(response.status, 404);
});

test('POST /api/v1/auth/sign-up/email accepts the configured web origin', async () => {
  assert.ok(process.env.WEB_APP_ORIGIN);

  const response = await app.request('/api/v1/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: process.env.WEB_APP_ORIGIN,
      cookie: 'demo=1',
    },
    body: JSON.stringify({
      email: 'trusted-origin-check@example.com',
      password: '123456',
      name: 'Trusted Origin Check',
    }),
  });

  assert.notEqual(response.status, 403);
});

test('GET /openapi.json includes auth and app routes in the merged schema', async () => {
  const response = await app.request('/openapi.json');
  const document = await response.json();

  assert.equal(response.status, 200);
  assert.equal(document.servers[0].url, APP_BASE_URL);
  assert.ok(document.paths['/api/v1/auth/get-session']);
  assert.ok(document.paths['/']);
  assert.ok(document.tags.some((tag: { name: string }) => tag.name === 'Auth'));
});
