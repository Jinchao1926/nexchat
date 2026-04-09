import { Hono } from 'hono';

import messageRoutes from '@/api/message';
import { requireSession } from '@/middlewares/require-session';

import {
  getAuthorizedConversation,
  getUserId,
  isConversationResponse,
} from './conversation-auth';
import {
  createConversation,
  deleteConversation,
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
app.route('/:id/messages', messageRoutes);

app.get('/', async (c) => {
  const userId = getUserId(c);
  const conversations = listConversationsByUserId(userId);

  return c.json({ data: conversations });
});

app.get('/:id', conversationIdParamValidator, async (c) => {
  const { id } = c.req.valid('param');
  const conversation = getAuthorizedConversation(c, id);

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  return c.json({ data: conversation });
});

app.post('/', createConversationValidator, async (c) => {
  const data = c.req.valid('json');
  const userId = getUserId(c);
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
    const existing = getAuthorizedConversation(c, id);

    if (isConversationResponse(existing)) {
      return existing;
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
  const existing = getAuthorizedConversation(c, id);

  if (isConversationResponse(existing)) {
    return existing;
  }

  const deleted = await deleteConversation(id);
  if (!deleted) {
    return c.json({ message: 'Failed to delete conversation' }, 400);
  }

  return c.json({ message: 'ok' });
});

export default app;
