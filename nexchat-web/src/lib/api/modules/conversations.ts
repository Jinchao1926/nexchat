import { getApiClient } from '$lib/api/core/client';
import type { ApiContext } from '$lib/api/core/types';
import type { Conversation } from '$lib/types/conversation';

interface ConversationsResponse {
  data: Conversation[];
}

export interface ConversationsApiResponse {
  data: Conversation[];
  error: string | null;
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
