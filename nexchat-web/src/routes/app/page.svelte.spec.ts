import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

const { goto, signOut, getConversations, getConversationMessages, streamAiChat } = vi.hoisted(
  () => ({
    goto: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
    getConversations: vi.fn(),
    getConversationMessages: vi.fn(),
    streamAiChat: vi.fn()
  })
);

vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$lib/auth/client', () => ({ signOut }));
vi.mock('$lib/api/modules/conversations', async () => {
  const actual = await vi.importActual<typeof import('$lib/api/modules/conversations')>(
    '$lib/api/modules/conversations'
  );

  return {
    ...actual,
    getConversations
  };
});
vi.mock('$lib/api/modules/messages', () => ({
  getConversationMessages,
  streamAiChat
}));

import AppPage from './+page.svelte';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('app page', () => {
  beforeEach(() => {
    goto.mockReset();
    signOut.mockClear();
    getConversations.mockReset();
    getConversationMessages.mockReset();
    streamAiChat.mockReset();
  });

  it('renders the new conversation state by default for logged-in users', async () => {
    render(AppPage, {
      data: { session: { user: { email: 'user@example.com' } }, conversations: [] }
    });

    await expect.element(page.getByText('Is there anything I can help with?')).toBeInTheDocument();
    await expect.element(page.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
    await expect.element(page.getByText('user@example.com')).toBeInTheDocument();
  });

  it('calls signOut when logout is clicked', async () => {
    render(AppPage, {
      data: { session: { user: { email: 'user@example.com' } }, conversations: [] }
    });

    await page.getByRole('button', { name: 'Logout' }).click();

    expect(signOut).toHaveBeenCalled();
    expect(goto).toHaveBeenCalledWith('/');
  });

  it('starts a new conversation from the title bar', async () => {
    render(AppPage, {
      data: { session: { user: { email: 'user@example.com' } }, conversations: [] }
    });

    await page.getByRole('button', { name: 'New conversation' }).click();

    await expect.element(page.getByText('Is there anything I can help with?')).toBeInTheDocument();
    await expect.element(page.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
  });

  it('streams the first drafted message without creating a conversation on the client', async () => {
    getConversations.mockResolvedValue({
      data: [
        {
          id: '42',
          title: 'Hello there',
          preview: 'Hello there',
          updatedAt: '2026-04-13T00:00:00.000Z'
        }
      ],
      error: null
    });
    streamAiChat.mockImplementation(async (_payload, callbacks) => {
      callbacks.onStart({
        conversationId: 42,
        userMessageId: 11,
        assistantMessageId: 12,
        provider: 'ollama',
        model: 'llama'
      });
      callbacks.onDelta({ content: '你' });
      callbacks.onDelta({ content: '好' });
      callbacks.onDone({ assistantMessageId: 12 });

      return { error: null };
    });
    getConversationMessages.mockResolvedValue({ data: [], error: null });

    render(AppPage, {
      data: { session: { user: { email: 'user@example.com' } }, conversations: [] }
    });

    await page.getByRole('button', { name: 'New conversation' }).click();
    await page.getByRole('textbox', { name: 'Message' }).fill('Hello there');
    await page.getByRole('button', { name: 'Send' }).click();

    expect(streamAiChat).toHaveBeenCalledWith(
      { content: 'Hello there' },
      expect.objectContaining({
        onStart: expect.any(Function),
        onDelta: expect.any(Function),
        onDone: expect.any(Function),
        onError: expect.any(Function)
      })
    );
    await expect.element(page.getByRole('article').getByText('Hello there')).toBeInTheDocument();
    await expect.element(page.getByRole('article').getByText('你好')).toBeInTheDocument();
  });

  it('updates the assistant message as streamed deltas arrive', async () => {
    const conversationList = [
      {
        id: '42',
        title: 'Hello there',
        preview: 'Hello there',
        updatedAt: '2026-04-13T00:00:00.000Z'
      }
    ];
    const refreshDeferred = createDeferred<{ data: typeof conversationList; error: null }>();
    const secondDeltaDeferred = createDeferred<void>();

    getConversations.mockReturnValue(refreshDeferred.promise);
    streamAiChat.mockImplementation(async (_payload, callbacks) => {
      callbacks.onStart({
        conversationId: 42,
        userMessageId: 11,
        assistantMessageId: 12,
        provider: 'ollama',
        model: 'llama'
      });
      callbacks.onDelta({ content: '你' });
      await secondDeltaDeferred.promise;
      callbacks.onDelta({ content: '好' });
      callbacks.onDone({ assistantMessageId: 12 });

      return { error: null };
    });

    render(AppPage, {
      data: { session: { user: { email: 'user@example.com' } }, conversations: [] }
    });

    await page.getByRole('textbox', { name: 'Message' }).fill('Hello there');
    await page.getByRole('button', { name: 'Send' }).click();

    expect(getConversations).toHaveBeenCalled();
    expect(streamAiChat).toHaveBeenCalledWith(
      { content: 'Hello there' },
      expect.objectContaining({
        onStart: expect.any(Function),
        onDelta: expect.any(Function)
      })
    );
    await expect.element(page.getByRole('article').getByText('你')).toBeInTheDocument();

    secondDeltaDeferred.resolve();

    refreshDeferred.resolve({ data: conversationList, error: null });

    await expect.element(page.getByRole('article').getByText('你好')).toBeInTheDocument();
  });

  it('sends the selected conversation id when streaming a reply', async () => {
    getConversationMessages.mockResolvedValue({ data: [], error: null });
    streamAiChat.mockResolvedValue({ error: null });

    render(AppPage, {
      data: {
        session: { user: { email: 'user@example.com' } },
        conversations: [
          {
            id: '42',
            title: 'First chat',
            preview: 'Hello',
            updatedAt: '2026-04-13T00:00:00.000Z'
          }
        ]
      }
    });

    await page.getByRole('button', { name: 'First chat' }).click();
    await page.getByRole('textbox', { name: 'Message' }).fill('Reply');
    await page.getByRole('button', { name: 'Send' }).click();

    expect(streamAiChat).toHaveBeenCalledWith(
      { content: 'Reply', conversationId: '42' },
      expect.objectContaining({
        onStart: expect.any(Function),
        onDelta: expect.any(Function)
      })
    );
  });

  it('toggles the sidebar from the title bar button', async () => {
    render(AppPage, {
      data: {
        session: { user: { email: 'user@example.com' } },
        conversations: [
          {
            id: 'c1',
            title: 'First chat',
            preview: 'Hello',
            updatedAt: '2026-04-13T00:00:00.000Z'
          }
        ]
      }
    });

    await expect.element(page.getByLabelText('Conversation sidebar')).toBeInTheDocument();

    await page.getByRole('button', { name: 'Toggle sidebar' }).click();

    await expect.element(page.getByLabelText('Conversation sidebar')).not.toBeInTheDocument();
  });
});
