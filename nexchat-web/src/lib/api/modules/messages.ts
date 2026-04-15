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

export interface StreamAiChatInput {
  content: string;
  conversationId?: string | number;
  model?: string;
}

export interface StreamAiStartEvent {
  conversationId: number;
  userMessageId: number;
  assistantMessageId: number;
  provider: string;
  model: string;
}

export interface StreamAiDeltaEvent {
  content: string;
}

export interface StreamAiDoneEvent {
  assistantMessageId: number;
}

export interface StreamAiErrorEvent {
  message: string;
}

export interface StreamAiChatCallbacks {
  onStart?: (event: StreamAiStartEvent) => void;
  onDelta?: (event: StreamAiDeltaEvent) => void;
  onDone?: (event: StreamAiDoneEvent) => void;
  onError?: (event: StreamAiErrorEvent) => void;
}

export interface StreamAiChatResponse {
  error: string | null;
}

type SseEventName = 'start' | 'delta' | 'done' | 'error';

interface ParsedSseEvent {
  event: string;
  data: unknown;
}

function parseSseEvent(block: string): ParsedSseEvent | null {
  const lines = block.split(/\r?\n/);
  const eventLine = lines.find((line) => line.startsWith('event:'));
  const dataLines = lines.filter((line) => line.startsWith('data:'));
  const event = eventLine?.slice('event:'.length).trim();
  const data = dataLines.map((line) => line.slice('data:'.length).trimStart()).join('\n');

  if (!event || !data) {
    return null;
  }

  try {
    return {
      event,
      data: JSON.parse(data) as unknown
    };
  } catch {
    return null;
  }
}

function isSseEventName(event: string): event is SseEventName {
  return event === 'start' || event === 'delta' || event === 'done' || event === 'error';
}

function dispatchSseEvent(event: ParsedSseEvent, callbacks: StreamAiChatCallbacks) {
  if (!isSseEventName(event.event)) {
    return null;
  }

  if (event.event === 'start') {
    callbacks.onStart?.(event.data as StreamAiStartEvent);
    return null;
  }

  if (event.event === 'delta') {
    callbacks.onDelta?.(event.data as StreamAiDeltaEvent);
    return null;
  }

  if (event.event === 'done') {
    callbacks.onDone?.(event.data as StreamAiDoneEvent);
    return null;
  }

  const errorEvent = event.data as StreamAiErrorEvent;
  callbacks.onError?.(errorEvent);
  return errorEvent.message || 'AI stream failed';
}

async function readSseStream(body: ReadableStream<Uint8Array>, callbacks: StreamAiChatCallbacks) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamError: string | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\n\n/);
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const event = parseSseEvent(block);
      const error = event ? dispatchSseEvent(event, callbacks) : null;

      if (error) {
        streamError = error;
      }
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    const event = parseSseEvent(buffer);
    const error = event ? dispatchSseEvent(event, callbacks) : null;

    if (error) {
      streamError = error;
    }
  }

  return streamError;
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

/**
 * Create message in a conversation
 * @deprecated please use streamAiChat instead.
 */
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

export async function streamAiChat(
  payload: StreamAiChatInput,
  callbacks: StreamAiChatCallbacks = {},
  context?: ApiContext
): Promise<StreamAiChatResponse> {
  const client = getApiClient(context);
  const body = {
    content: payload.content,
    ...(payload.conversationId ? { conversationId: payload.conversationId } : undefined),
    ...(payload.model ? { model: payload.model } : undefined)
  };

  try {
    const { error, response } = await client.request<null>(
      '/ai/stream',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      },
      'Failed to stream AI response'
    );

    if (error) {
      return { error };
    }

    if (!response.body) {
      return { error: 'AI stream is unavailable' };
    }

    return {
      error: await readSseStream(response.body, callbacks)
    };
  } catch {
    return { error: 'Message server is unavailable' };
  }
}
