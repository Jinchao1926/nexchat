import { z } from '@hono/zod-openapi';

export const conversationIdParamsSchema = z.object({
  id: z
    .coerce
    .number()
    .int()
    .positive()
    .openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      example: 1,
    }),
});

export const createConversationBodySchema = z
  .object({
    title: z.string().trim().min(2).max(20),
  })
  .strict();

export const updateConversationBodySchema = z.object({
  title: z.string().trim().min(2).max(20),
});

export type ConversationIdParams = z.infer<typeof conversationIdParamsSchema>;
export type CreateConversationBody = z.infer<
  typeof createConversationBodySchema
>;
export type UpdateConversationBody = z.infer<
  typeof updateConversationBodySchema
>;
