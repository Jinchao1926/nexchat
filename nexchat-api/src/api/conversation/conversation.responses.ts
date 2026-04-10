import { z } from '@hono/zod-openapi';

export const conversationResponseSchema = z.object({
  id: z.number().int().positive(),
  userId: z.string(),
  title: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const conversationsListResponseSchema = z.object({
  data: z.array(conversationResponseSchema),
});

export const conversationSingleResponseSchema = z.object({
  data: conversationResponseSchema,
});
