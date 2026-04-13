export interface AuthPayload {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResult<T> {
  data: T | null;
  error: string | null;
}
