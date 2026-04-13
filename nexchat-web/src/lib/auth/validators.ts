export interface AuthInput {
  email: string;
  password: string;
}

export type AuthErrors = Partial<Record<keyof AuthInput, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthInput(input: AuthInput): AuthErrors {
  const errors: AuthErrors = {};

  if (!input.email.trim() || !emailPattern.test(input.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (input.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
}
