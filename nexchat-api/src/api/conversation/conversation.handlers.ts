import type { Context } from 'hono';

import {
  getAuthorizedConversation,
  getUserId,
  isConversationResponse,
} from './conversation-auth';
import type {
  ConversationIdParams,
  CreateConversationBody,
  UpdateConversationBody,
} from './conversation.schemas';
import {
  createConversation,
  deleteConversation,
  listConversationsByUserId,
  updateConversation,
} from './conversation.service';

function toConversationResponse(conversation: {
  id: number;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...conversation,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

export async function listConversationsHandler(c: Context) {
  const userId = getUserId(c);
  const conversations = listConversationsByUserId(userId);

  return c.json({ data: conversations.map(toConversationResponse) }, 200);
}

export async function getConversationHandler(c: Context) {
  const { id } = c.req.valid('param' as never) as ConversationIdParams;
  const conversation = getAuthorizedConversation(c, id);

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  return c.json({ data: toConversationResponse(conversation) }, 200);
}

export async function createConversationHandler(c: Context) {
  const data = c.req.valid('json' as never) as CreateConversationBody;
  const userId = getUserId(c);
  const conversation = await createConversation(data, userId);

  if (!conversation) {
    return c.json({ message: 'Failed to create conversation' }, 400);
  }

  return c.json({ data: toConversationResponse(conversation) }, 201);
}

export async function updateConversationHandler(c: Context) {
  const { id } = c.req.valid('param' as never) as ConversationIdParams;
  const data = c.req.valid('json' as never) as UpdateConversationBody;
  const existing = getAuthorizedConversation(c, id);

  if (isConversationResponse(existing)) {
    return existing;
  }

  const conversation = await updateConversation(id, data);
  if (!conversation) {
    return c.json({ message: 'Failed to update conversation' }, 400);
  }

  return c.json({ data: toConversationResponse(conversation) }, 200);
}

export async function deleteConversationHandler(c: Context) {
  const { id } = c.req.valid('param' as never) as ConversationIdParams;
  const existing = getAuthorizedConversation(c, id);

  if (isConversationResponse(existing)) {
    return existing;
  }

  const deleted = await deleteConversation(id);
  if (!deleted) {
    return c.json({ message: 'Failed to delete conversation' }, 400);
  }

  return c.json({ message: 'ok' as const }, 200);
}
