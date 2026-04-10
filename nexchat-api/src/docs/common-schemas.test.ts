import assert from 'node:assert/strict';
import test from 'node:test';

import {
  badRequestResponseSchema,
  errorResponseSchema,
  okMessageResponseSchema,
  sessionCookieSecurity,
} from './common-schemas';

test('common docs schemas export shared response primitives', () => {
  assert.equal(
    errorResponseSchema.safeParse({ message: 'nope' }).success,
    true
  );
  assert.equal(
    okMessageResponseSchema.safeParse({ message: 'ok' }).success,
    true
  );
  assert.equal(
    badRequestResponseSchema.safeParse({ message: 'invalid' }).success,
    true
  );
  assert.deepEqual(sessionCookieSecurity, [{ sessionCookie: [] }]);
});
