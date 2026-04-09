import { Hono } from 'hono';

import { getSessionUser, requireSession } from '@/middlewares/require-session';

import {
  createConversation,
  deleteConversation,
  getConversationById,
  listConversationsByUserId,
  updateConversation,
} from './conversation.service';
import {
  conversationIdParamValidator,
  createConversationValidator,
  updateConversationValidator,
} from './conversation.validators';

const app = new Hono();

app.use('*', requireSession);

app.get('/', async (c) => {
  const userId = getSessionUser(c).id;
  const conversations = listConversationsByUserId(userId);

  return c.json({ data: conversations });
});

app.get('/:id', conversationIdParamValidator, async (c) => {
  const { id } = c.req.valid('param');
  const userId = getSessionUser(c).id;
  const conversation = getConversationById(id);

  if (!conversation) {
    return c.json({ message: 'Conversation not found' }, 404);
  }

  if (conversation.userId !== userId) {
    return c.json({ message: 'Unauthorized' }, 403);
  }

  return c.json({ data: conversation });
});

app.post('/', createConversationValidator, async (c) => {
  const data = c.req.valid('json');
  const userId = getSessionUser(c).id;
  const conversation = await createConversation(data, userId);

  if (!conversation) {
    return c.json({ message: 'Failed to create conversation' }, 400);
  }

  return c.json({ data: conversation }, 201);
});

app.patch(
  '/:id',
  conversationIdParamValidator,
  updateConversationValidator,
  async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const userId = getSessionUser(c).id;
    const existing = getConversationById(id);

    if (!existing) {
      return c.json({ message: 'Conversation not found' }, 404);
    }

    if (existing.userId !== userId) {
      return c.json({ message: 'Unauthorized' }, 403);
    }

    const conversation = await updateConversation(id, data);
    if (!conversation) {
      return c.json({ message: 'Failed to update conversation' }, 400);
    }

    return c.json({ data: conversation });
  }
);

app.delete('/:id', conversationIdParamValidator, async (c) => {
  const { id } = c.req.valid('param');
  const userId = getSessionUser(c).id;
  const existing = getConversationById(id);

  if (!existing) {
    return c.json({ message: 'Conversation not found' }, 404);
  }

  if (existing.userId !== userId) {
    return c.json({ message: 'Unauthorized' }, 403);
  }

  const deleted = await deleteConversation(id);
  if (!deleted) {
    return c.json({ message: 'Failed to delete conversation' }, 400);
  }

  return c.json({ message: 'ok' });
});

export default app;
