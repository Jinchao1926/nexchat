import { Hono } from 'hono';

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

app.get('/', async (c) => {
  // TODO: Extract from session middleware
  const userId = 1;
  const conversations = listConversationsByUserId(userId);
  return c.json({ data: conversations });
});

app.get('/:id', conversationIdParamValidator, async (c) => {
  const { id } = c.req.valid('param');
  const conversation = getConversationById(id);

  if (!conversation) {
    return c.json({ message: 'Conversation not found' }, 404);
  }

  return c.json({ data: conversation });
});

app.post('/', createConversationValidator, async (c) => {
  const data = c.req.valid('json');

  const conversation = await createConversation(data);
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
    const userId = 1; // TODO: Extract from session

    // Verify ownership
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
  const userId = 1; // TODO: Extract from session

  // Verify ownership
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
