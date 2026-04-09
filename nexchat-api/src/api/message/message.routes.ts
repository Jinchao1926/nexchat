import { Hono } from 'hono';
import type { Context } from 'hono';

import {
  getAuthorizedConversation,
  isConversationResponse,
} from '@/api/conversation/conversation-auth';
import { requireSession } from '@/middlewares/require-session';

import {
  createMessage,
  deleteMessage,
  getMessageById,
  listMessagesByConversationId,
  updateMessage,
} from './message.service';
import {
  createMessageValidator,
  messageIdParamValidator,
  updateMessageValidator,
} from './message.validators';

const app = new Hono();

app.use('*', requireSession);

function getConversationId(c: Context) {
  return Number(c.req.param('id'));
}

function getConversationMessage(c: Context, conversationId: number, messageId: number) {
  const message = getMessageById(messageId);

  if (!message || message.conversationId !== conversationId) {
    return c.json({ message: 'Message not found' }, 404);
  }

  return message;
}

app.get('/', async (c) => {
  const conversation = getAuthorizedConversation(c, getConversationId(c));

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const messages = listMessagesByConversationId(conversation.id);

  return c.json({ data: messages });
});

app.get('/:messageId', messageIdParamValidator, async (c) => {
  const { messageId } = c.req.valid('param');
  const conversation = getAuthorizedConversation(c, getConversationId(c));

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const message = getConversationMessage(c, conversation.id, messageId);

  if (message instanceof Response) {
    return message;
  }

  return c.json({ data: message });
});

app.post('/', createMessageValidator, async (c) => {
  const data = c.req.valid('json');
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

  return c.json({ data: message }, 201);
});

app.patch(
  '/:messageId',
  messageIdParamValidator,
  updateMessageValidator,
  async (c) => {
    const { messageId } = c.req.valid('param');
    const data = c.req.valid('json');
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

    return c.json({ data: message });
  }
);

app.delete('/:messageId', messageIdParamValidator, async (c) => {
  const { messageId } = c.req.valid('param');
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

  return c.json({ message: 'ok' });
});

export default app;
