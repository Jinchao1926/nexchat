const SSE_HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache, no-transform',
  connection: 'keep-alive',
} as const;

export interface SsePayloadByEvent {
  start: {
    conversationId: number;
    userMessageId: number;
    assistantMessageId: number;
    provider: string;
    model: string;
  };
  delta: {
    content: string;
  };
  done: {
    assistantMessageId: number;
  };
  error: {
    message: string;
  };
}

export function encodeSse<Event extends keyof SsePayloadByEvent>(
  event: Event,
  data: SsePayloadByEvent[Event]
) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function createSseWriter(
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  const encoder = new TextEncoder();

  return <Event extends keyof SsePayloadByEvent>(
    event: Event,
    data: SsePayloadByEvent[Event]
  ) => {
    controller.enqueue(encoder.encode(encodeSse(event, data)));
  };
}

export { SSE_HEADERS };
