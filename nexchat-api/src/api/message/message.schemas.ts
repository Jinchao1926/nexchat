import { z } from '@hono/zod-openapi';

export const conversationIdParamsSchema = z.object({
  id: z.coerce
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

export const conversationMessageParamsSchema =
  conversationIdParamsSchema.extend({
    messageId: z.coerce
      .number()
      .int()
      .positive()
      .openapi({
        param: {
          name: 'messageId',
          in: 'path',
        },
        example: 1,
      }),
  });

export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);
export const messageStatusSchema = z.enum([
  'pending',
  'streaming',
  'completed',
  'failed',
]);

export const createMessageBodySchema = z
  .object({
    role: messageRoleSchema,
    content: z.string().trim().nonempty(),
  })
  .strict();

export const updateMessageBodySchema = z.object({
  content: z.string().trim().nonempty(),
});

export type ConversationIdParams = z.infer<typeof conversationIdParamsSchema>;
export type ConversationMessageParams = z.infer<
  typeof conversationMessageParamsSchema
>;
export type CreateMessageBody = z.infer<typeof createMessageBodySchema>;
export type UpdateMessageBody = z.infer<typeof updateMessageBodySchema>;
