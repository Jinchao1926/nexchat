import { z } from 'zod';

import {
  createJsonValidator,
  createParamValidator,
  idParamSchema,
} from '@/validator';

const createConversationBodySchema = z.object({
  userId: z.int().positive(),
  title: z.string(),
});
const updateConversationBodySchema = z.object({
  title: z.string().trim().min(2).max(20),
});

export const createConversationValidator = createJsonValidator(
  createConversationBodySchema,
  'Invalid conversation payload'
);
export const updateConversationValidator = createJsonValidator(
  updateConversationBodySchema,
  'Invalid conversation title'
);
export const conversationIdParamValidator = createParamValidator(
  idParamSchema,
  'Invalid conversation id'
);

export type CreateConversationBody = z.infer<
  typeof createConversationBodySchema
>;
export type UpdateConversationBody = z.infer<
  typeof updateConversationBodySchema
>;
export type ConversationIdParams = z.infer<typeof conversationIdParamValidator>;
