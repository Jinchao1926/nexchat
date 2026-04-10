import type { Context } from 'hono';

import {
  getAuthorizedConversation,
  isConversationResponse,
} from '@/api/conversation/conversation-auth';

import type {
  ConversationMessageParams,
  CreateMessageBody,
  UpdateMessageBody,
} from './message.schemas';
import {
  createMessage,
  deleteMessage,
  getMessageById,
  listMessagesByConversationId,
  updateMessage,
} from './message.service';

function getConversationId(c: Context) {
  return Number(c.req.param('id'));
}

function getConversationMessage(
  c: Context,
  conversationId: number,
  messageId: number
) {
  const message = getMessageById(messageId);

  if (!message || message.conversationId !== conversationId) {
    return c.json({ message: 'Message not found' }, 404);
  }

  return message;
}

function toMessageResponse(message: {
  id: number;
  conversationId: number;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

export async function listMessagesHandler(c: Context) {
  const conversation = getAuthorizedConversation(c, getConversationId(c));

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const messages = listMessagesByConversationId(conversation.id);

  return c.json({ data: messages.map(toMessageResponse) }, 200);
}

export async function getMessageHandler(c: Context) {
  const { messageId } = c.req.valid(
    'param' as never
  ) as ConversationMessageParams;
  const conversation = getAuthorizedConversation(c, getConversationId(c));

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const message = getConversationMessage(c, conversation.id, messageId);

  if (message instanceof Response) {
    return message;
  }

  return c.json({ data: toMessageResponse(message) }, 200);
}

export async function createMessageHandler(c: Context) {
  const data = c.req.valid('json' as never) as CreateMessageBody;
  const conversation = getAuthorizedConversation(c, getConversationId(c));

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const message = await createMessage({
    ...data,
    conversationId: conversation.id,
    userId: conversation.userId,
  });

  if (!message) {
    return c.json({ message: 'Failed to create message' }, 400);
  }

  return c.json({ data: toMessageResponse(message) }, 201);
}

export async function updateMessageHandler(c: Context) {
  const { messageId } = c.req.valid(
    'param' as never
  ) as ConversationMessageParams;
  const data = c.req.valid('json' as never) as UpdateMessageBody;
  const conversation = getAuthorizedConversation(c, getConversationId(c));

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const existing = getConversationMessage(c, conversation.id, messageId);

  if (existing instanceof Response) {
    return existing;
  }

  const message = await updateMessage(messageId, data);
  if (!message) {
    return c.json({ message: 'Failed to update message' }, 400);
  }

  return c.json({ data: toMessageResponse(message) }, 200);
}

export async function deleteMessageHandler(c: Context) {
  const { messageId } = c.req.valid(
    'param' as never
  ) as ConversationMessageParams;
  const conversation = getAuthorizedConversation(c, getConversationId(c));

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const existing = getConversationMessage(c, conversation.id, messageId);

  if (existing instanceof Response) {
    return existing;
  }

  const deleted = await deleteMessage(messageId);
  if (!deleted) {
    return c.json({ message: 'Failed to delete message' }, 400);
  }

  return c.json({ message: 'ok' as const }, 200);
}
