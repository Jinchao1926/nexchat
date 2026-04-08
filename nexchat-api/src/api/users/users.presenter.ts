import { users } from '../../db/schema';

type UserRecord = typeof users.$inferSelect;

export function serializeUser(user: UserRecord) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function serializeUsers(list: UserRecord[]) {
  return list.map(serializeUser);
}
