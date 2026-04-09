import type { Context } from 'hono';

import { getSessionUser } from '@/middlewares/require-session';

import { getConversationById, type ConversationRecord } from './conversation.service';

export function getUserId(c: Context) {
  return getSessionUser(c).id;
}

export function getAuthorizedConversation(c: Context, id: number) {
  const conversation = getConversationById(id);

  if (!conversation) {
    return c.json({ message: 'Conversation not found' }, 404);
  }

  if (conversation.userId !== getUserId(c)) {
    return c.json({ message: 'Unauthorized' }, 403);
  }

  return conversation;
}

export function isConversationResponse(
  value: ConversationRecord | Response
): value is Response {
  return value instanceof Response;
}
