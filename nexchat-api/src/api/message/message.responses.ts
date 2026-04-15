import { z } from '@hono/zod-openapi';

export const messageResponseSchema = z.object({
  id: z.number().int().positive(),
  conversationId: z.number().int().positive(),
  userId: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  status: z.enum(['pending', 'streaming', 'completed', 'failed']),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const messagesListResponseSchema = z.object({
  data: z.array(messageResponseSchema),
});

export const messageSingleResponseSchema = z.object({
  data: messageResponseSchema,
});
