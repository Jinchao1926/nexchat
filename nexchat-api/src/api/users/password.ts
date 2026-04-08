import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PASSWORD_SALT_SIZE = 16;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_ENCODING = 'hex';

export function hashPassword(password: string) {
  const salt = randomBytes(PASSWORD_SALT_SIZE).toString(PASSWORD_ENCODING);
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString(
    PASSWORD_ENCODING
  );

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  const [salt, storedHash] = storedPassword.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const passwordHash = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const storedHashBuffer = Buffer.from(storedHash, PASSWORD_ENCODING);

  if (passwordHash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(passwordHash, storedHashBuffer);
}
