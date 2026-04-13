import { getApiClient } from '$lib/api/core/client';
import type { ApiContext } from '$lib/api/core/types';
import type { Conversation } from '$lib/types/conversation';

interface ConversationsResponse {
  data: Conversation[];
}

interface ConversationResponse {
  data: Conversation;
}

export interface ConversationsApiResponse {
  data: Conversation[];
  error: string | null;
}

export interface ConversationApiResponse {
  data: Conversation | null;
  error: string | null;
}

export interface CreateConversationInput {
  title: string;
}

export async function getConversations(context?: ApiContext): Promise<ConversationsApiResponse> {
  const client = getApiClient(context);

  try {
    const { data, error } = await client.get<ConversationsResponse>(
      '/conversations',
      'Failed to load conversations'
    );

    return {
      data: data?.data ?? [],
      error: error ?? null
    };
  } catch {
    return {
      data: [],
      error: 'Conversation server is unavailable'
    };
  }
}

export async function createConversation(
  payload: CreateConversationInput,
  context?: ApiContext
): Promise<ConversationApiResponse> {
  const client = getApiClient(context);

  try {
    const { data: body, error } = await client.post<ConversationResponse>(
      '/conversations',
      payload,
      'Failed to create conversation'
    );

    return {
      data: body?.data ?? null,
      error: error ?? null
    };
  } catch {
    return {
      data: null,
      error: 'Conversation server is unavailable'
    };
  }
}
