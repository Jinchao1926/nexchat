import { type DatabaseClient, db } from '@/db';
import {
  type ConversationRecord,
  createConversation,
  getConversationById,
} from '@/api/conversation/conversation.service';

const MAX_AI_CONVERSATION_TITLE_LENGTH = 20;
const DEFAULT_AI_CONVERSATION_TITLE = 'New Chat';

export function createAiConversationTitle(content: string) {
  const normalized = content.trim().replace(/\s+/g, ' ');
  const title = normalized
    .slice(0, MAX_AI_CONVERSATION_TITLE_LENGTH)
    .trimEnd();

  return title || DEFAULT_AI_CONVERSATION_TITLE;
}

interface ResolveAiConversationInput {
  userId: string;
  content: string;
  conversationId?: number | undefined;
}

type ResolveAiConversationResult =
  | {
      ok: true;
      created: boolean;
      conversation: ConversationRecord;
    }
  | {
      ok: false;
      status: 403 | 404;
      message: string;
    };

export async function resolveAiConversation(
  input: ResolveAiConversationInput,
  database: DatabaseClient = db
): Promise<ResolveAiConversationResult> {
  const { userId, content, conversationId } = input;

  if (conversationId) {
    const conversation = getConversationById(conversationId, database);

    if (!conversation) {
      return {
        ok: false,
        status: 404,
        message: 'Conversation not found',
      };
    }

    if (conversation.userId !== userId) {
      return {
        ok: false,
        status: 403,
        message: 'Unauthorized',
      };
    }

    return {
      ok: true,
      created: false,
      conversation,
    };
  }

  const conversation = await createConversation(
    {
      title: createAiConversationTitle(content),
    },
    userId,
    database
  );

  if (!conversation) {
    return {
      ok: false,
      status: 404,
      message: 'Failed to create conversation',
    };
  }

  return {
    ok: true,
    created: true,
    conversation,
  };
}
