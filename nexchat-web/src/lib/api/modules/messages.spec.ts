import { describe, expect, it, vi } from 'vitest';

import { createConversationMessage, getConversationMessages, streamAiChat } from './messages';

describe('messages api module', () => {
  it('returns typed message records from a nested data payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: [
          {
            id: 'm1',
            conversationId: 'c1',
            userId: 'u1',
            role: 'user',
            content: 'Hello',
            createdAt: '2026-04-10T00:00:00.000Z',
            updatedAt: '2026-04-10T00:00:00.000Z'
          }
        ]
      })
    );

    const result = await getConversationMessages('c1', fetchMock as typeof fetch);

    expect(result).toEqual({
      data: [
        {
          id: 'm1',
          conversationId: 'c1',
          userId: 'u1',
          role: 'user',
          content: 'Hello',
          createdAt: '2026-04-10T00:00:00.000Z',
          updatedAt: '2026-04-10T00:00:00.000Z'
        }
      ],
      error: null
    });
  });

  it('returns a normalized unavailable error when fetch throws', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const result = await getConversationMessages('c1', fetchMock as typeof fetch);

    expect(result).toEqual({
      data: null,
      error: 'Message server is unavailable'
    });
  });

  it('creates a message through the simplified module entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: {
          id: 'm1',
          conversationId: 'c1',
          userId: 'u1',
          role: 'user',
          content: 'Hello',
          createdAt: '2026-04-10T00:00:00.000Z',
          updatedAt: '2026-04-10T00:00:00.000Z'
        }
      })
    );

    const result = await createConversationMessage(
      'c1',
      { role: 'user', content: 'Hello' },
      fetchMock as typeof fetch
    );

    expect(result).toEqual({
      data: {
        id: 'm1',
        conversationId: 'c1',
        userId: 'u1',
        role: 'user',
        content: 'Hello',
        createdAt: '2026-04-10T00:00:00.000Z',
        updatedAt: '2026-04-10T00:00:00.000Z'
      },
      error: null
    });
  });

  it('streams an AI chat response through server-sent events', async () => {
    const encoder = new TextEncoder();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                [
                  'event: start',
                  'data: {"conversationId":42,"userMessageId":11,"assistantMessageId":12,"provider":"ollama","model":"llama"}',
                  '',
                  'event: delta',
                  'data: {"content":"你"}',
                  '',
                  'event: delta',
                  'data: {"content":"好"}',
                  '',
                  'event: done',
                  'data: {"assistantMessageId":12}',
                  '',
                  ''
                ].join('\n')
              )
            );
            controller.close();
          }
        }),
        {
          headers: { 'content-type': 'text/event-stream' }
        }
      )
    );
    const events: string[] = [];

    const result = await streamAiChat(
      { content: '你好', conversationId: '42' },
      {
        onStart: (event) => events.push(`start:${event.conversationId}`),
        onDelta: (event) => events.push(`delta:${event.content}`),
        onDone: (event) => events.push(`done:${event.assistantMessageId}`)
      },
      fetchMock as typeof fetch
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:6001/api/v1/ai/stream',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ content: '你好', conversationId: '42' })
      })
    );
    expect(result).toEqual({ error: null });
    expect(events).toEqual(['start:42', 'delta:你', 'delta:好', 'done:12']);
  });

  it('returns streamed AI errors from error events', async () => {
    const encoder = new TextEncoder();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                ['event: error', 'data: {"message":"Model unavailable"}', '', ''].join('\n')
              )
            );
            controller.close();
          }
        }),
        {
          headers: { 'content-type': 'text/event-stream' }
        }
      )
    );

    const result = await streamAiChat(
      { content: 'Hello' },
      {
        onError: vi.fn()
      },
      fetchMock as typeof fetch
    );

    expect(result).toEqual({ error: 'Model unavailable' });
  });
});
