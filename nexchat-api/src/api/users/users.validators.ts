import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { z } from 'zod';

import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '@/db/schema';

export const createUserBodySchema = z.object({
  username: z.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  nickname: z.string().trim().min(NICKNAME_MIN_LENGTH).max(NICKNAME_MAX_LENGTH),
});

export const updateUserBodySchema = createUserBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type ValidationResult =
  | { success: true; data: unknown }
  | { success: false; error: { issues: z.ZodIssue[] } };

function createValidationHook(message: string) {
  return (result: ValidationResult, c: Context) => {
    if (!result.success) {
      return c.json({ message, errors: result.error.issues }, 400);
    }
  };
}

export const createUserValidator = zValidator(
  'json',
  createUserBodySchema,
  createValidationHook('Invalid user payload')
);

export const updateUserValidator = zValidator(
  'json',
  updateUserBodySchema,
  createValidationHook('Invalid user payload')
);

export const userIdParamValidator = zValidator(
  'param',
  userIdParamSchema,
  createValidationHook('Invalid user id')
);

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type UserIdParams = z.infer<typeof userIdParamSchema>;
