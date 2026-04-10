import { z } from '@hono/zod-openapi';

export const messageResponseSchema = z.object({
  id: z.number().int().positive(),
  conversationId: z.number().int().positive(),
  userId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const messagesListResponseSchema = z.object({
  data: z.array(messageResponseSchema),
});

export const messageSingleResponseSchema = z.object({
  data: messageResponseSchema,
});
