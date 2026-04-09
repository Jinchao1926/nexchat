import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

type ValidationResult =
  | { success: true; data: unknown }
  | { success: false; error: { issues: z.ZodIssue[] } };

export function createValidationHook(message: string) {
  return (result: ValidationResult, c: Context) => {
    if (!result.success) {
      return c.json({ message, errors: result.error.issues }, 400);
    }
  };
}

export function createJsonValidator<T extends z.ZodTypeAny>(
  schema: T,
  message: string
) {
  return zValidator('json', schema, createValidationHook(message));
}

export function createParamValidator<T extends z.ZodTypeAny>(
  schema: T,
  message: string
) {
  return zValidator('param', schema, createValidationHook(message));
}
