import assert from 'node:assert/strict';
import test from 'node:test';

import app from './app';

test('OPTIONS /api/v1/auth/sign-in/email returns CORS headers for the web app', async () => {
  const response = await app.request('/api/v1/auth/sign-in/email', {
    method: 'OPTIONS',
    headers: {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'http://localhost:5173'
  );
  assert.equal(
    response.headers.get('access-control-allow-credentials'),
    'true'
  );
});

test('GET /openapi.json includes auth and app routes in the merged schema', async () => {
  const response = await app.request('/openapi.json');
  const document = await response.json();

  assert.equal(response.status, 200);
  assert.ok(document.paths['/api/v1/auth/get-session']);
  assert.ok(document.paths['/']);
  assert.ok(document.tags.some((tag: { name: string }) => tag.name === 'Auth'));
});
