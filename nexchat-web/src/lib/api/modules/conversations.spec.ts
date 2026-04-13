import { describe, expect, it, vi } from 'vitest';

import { createConversation, getConversations } from './conversations';

describe('conversations api module', () => {
  it('returns typed conversation records from the data field', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: [
          {
            id: 'c1',
            title: 'First',
            preview: 'Hello',
            updatedAt: '2026-04-10T00:00:00.000Z'
          }
        ]
      })
    );

    const result = await getConversations(fetchMock as typeof fetch);

    expect(result).toEqual({
      data: [
        {
          id: 'c1',
          title: 'First',
          preview: 'Hello',
          updatedAt: '2026-04-10T00:00:00.000Z'
        }
      ],
      error: null
    });
  });

  it('returns an empty list when the server is unreachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const result = await getConversations(fetchMock as typeof fetch);

    expect(result).toEqual({
      data: [],
      error: 'Conversation server is unavailable'
    });
  });

  it('creates a conversation through the simplified module entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: {
          id: 'c1',
          title: 'Hello there',
          preview: 'Hello there',
          updatedAt: '2026-04-10T00:00:00.000Z'
        }
      })
    );

    const result = await createConversation({ title: 'Hello there' }, fetchMock as typeof fetch);

    expect(result).toEqual({
      data: {
        id: 'c1',
        title: 'Hello there',
        preview: 'Hello there',
        updatedAt: '2026-04-10T00:00:00.000Z'
      },
      error: null
    });
  });
});
