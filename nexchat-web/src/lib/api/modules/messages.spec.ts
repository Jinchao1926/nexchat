import { describe, expect, it, vi } from 'vitest';

import { createConversationMessage, getConversationMessages } from './messages';

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
});
