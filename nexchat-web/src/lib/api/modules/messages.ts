import { getApiClient } from '$lib/api/core/client';
import type { ApiContext } from '$lib/api/core/types';
import type { ConversationMessage } from '$lib/types/message';

export interface MessagesApiResponse {
  data: ConversationMessage[] | null;
  error: string | null;
}

export interface MessageApiResponse {
  data: ConversationMessage | null;
  error: string | null;
}

export interface CreateMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export async function getConversationMessages(
  conversationId: string,
  context?: ApiContext
): Promise<MessagesApiResponse> {
  const client = getApiClient(context);

  try {
    const { data: payload, error } = await client.get<MessagesApiResponse>(
      `/conversations/${conversationId}/messages`,
      'Failed to load messages'
    );

    return {
      data: payload?.data ?? [],
      error: error ?? null
    };
  } catch {
    return { data: null, error: 'Message server is unavailable' };
  }
}

export async function createConversationMessage(
  conversationId: string,
  payload: CreateMessageInput,
  context?: ApiContext
): Promise<MessageApiResponse> {
  const client = getApiClient(context);

  try {
    const { data: body, error } = await client.post<MessageApiResponse>(
      `/conversations/${conversationId}/messages`,
      payload,
      'Failed to send message'
    );

    return { data: body?.data ?? null, error: error ?? null };
  } catch {
    return { data: null, error: 'Message server is unavailable' };
  }
}
