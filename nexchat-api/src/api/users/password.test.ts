import assert from 'node:assert/strict';
import test from 'node:test';

import { hashPassword, verifyPassword } from './password';

test('hashPassword produces a salted hash that verifyPassword accepts', () => {
  const hashedPassword = hashPassword('secret123');

  assert.equal(typeof hashedPassword, 'string');
  assert.notEqual(hashedPassword, 'secret123');
  assert.equal(verifyPassword('secret123', hashedPassword), true);
  assert.equal(verifyPassword('wrong-password', hashedPassword), false);
});
