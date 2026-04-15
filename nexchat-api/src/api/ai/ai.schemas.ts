import { z } from '@hono/zod-openapi';

export const aiChatParamsSchema = z.object({
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

export const streamAiChatBodySchema = z
  .object({
    content: z.string().trim().nonempty(),
    model: z.string().trim().nonempty().optional(),
    conversationId: z.coerce.number().int().positive().optional(),
  })
  .strict();

export const streamConversationAiChatBodySchema = z
  .object({
    content: z.string().trim().nonempty(),
    model: z.string().trim().nonempty().optional(),
  })
  .strict();

export type AiChatParams = z.infer<typeof aiChatParamsSchema>;
export type StreamAiChatBody = z.infer<typeof streamAiChatBodySchema>;
export type StreamConversationAiChatBody = z.infer<
  typeof streamConversationAiChatBodySchema
>;
