import { z } from '@hono/zod-openapi';

export const errorResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi('ErrorResponse');

export const validationErrorIssueSchema = z
  .object({
    code: z.string(),
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
  })
  .partial();

export const validationErrorResponseSchema = z
  .object({
    message: z.string(),
    errors: z.array(validationErrorIssueSchema),
  })
  .openapi('ValidationErrorResponse');

export const badRequestResponseSchema = z.union([
  errorResponseSchema,
  validationErrorResponseSchema,
]);

export const okMessageResponseSchema = z.object({
  message: z.literal('ok'),
});

export const sessionCookieSecurity = [{ sessionCookie: [] }];
