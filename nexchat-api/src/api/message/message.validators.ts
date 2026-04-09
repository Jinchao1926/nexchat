import { z } from 'zod';

import { createJsonValidator, createParamValidator } from '@/validator';

export const createMessageBodySchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().nonempty(),
  })
  .strict();
const updateMessageBodySchema = z.object({
  content: z.string().trim().nonempty(),
});
const messageIdParamSchema = z.object({
  messageId: z.coerce.number().int().positive(),
});

export const createMessageValidator = createJsonValidator(
  createMessageBodySchema,
  'Invalid message payload'
);
export const updateMessageValidator = createJsonValidator(
  updateMessageBodySchema,
  'Invalid message content'
);
export const messageIdParamValidator = createParamValidator(
  messageIdParamSchema,
  'Invalid message id'
);

export type CreateMessageBody = z.infer<typeof createMessageBodySchema>;
export type UpdateMessageBody = z.infer<typeof updateMessageBodySchema>;
export type MessageIdParams = z.infer<typeof messageIdParamValidator>;
