import type { Context } from 'hono';

import {
  getAuthorizedConversation,
  isConversationResponse,
} from '@/api/conversation/conversation-auth';
import { createAiProvider } from '@/lib/ai/provider';

import type { StreamAiChatBody } from './ai.schemas';
import { SSE_HEADERS } from './ai.sse';
import { createAiChatStream } from './ai.stream';

export async function streamAiChatHandler(c: Context) {
  const data = c.req.valid('json' as never) as StreamAiChatBody;
  const conversationId = Number(c.req.param('id'));
  const conversation = getAuthorizedConversation(c, conversationId);

  if (isConversationResponse(conversation)) {
    return conversation;
  }

  const provider = createAiProvider();
  const model = data.model ?? provider.defaultModel;
  const result = await createAiChatStream({
    conversation,
    provider,
    model,
    content: data.content,
  });

  if (!result.ok) {
    return c.json({ message: result.message }, 400);
  }

  return new Response(result.stream, {
    headers: SSE_HEADERS,
  });
}
