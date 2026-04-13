import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

const {
  goto,
  signOut,
  createConversation,
  getConversations,
  getConversationMessages,
  createConversationMessage
} =
  vi.hoisted(() => ({
    goto: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
    createConversation: vi.fn(),
    getConversations: vi.fn(),
    getConversationMessages: vi.fn(),
    createConversationMessage: vi.fn()
  }));

vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$lib/auth/client', () => ({ signOut }));
vi.mock('$lib/api/modules/conversations', async () => {
  const actual = await vi.importActual<typeof import('$lib/api/modules/conversations')>(
    '$lib/api/modules/conversations'
  );

  return {
    ...actual,
    getConversations,
    createConversation
  };
});
vi.mock('$lib/api/modules/messages', () => ({
  getConversationMessages,
  createConversationMessage
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
    createConversation.mockReset();
    getConversations.mockReset();
    getConversationMessages.mockReset();
    createConversationMessage.mockReset();
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

  it('creates a conversation from the first drafted message', async () => {
    createConversation.mockResolvedValue({
      data: {
        id: 'c-new',
        title: 'Hello there',
        preview: 'Hello there',
        updatedAt: '2026-04-13T00:00:00.000Z'
      },
      error: null
    });
    getConversations.mockResolvedValue({
      data: [
        {
          id: 'c-new',
          title: 'Hello there',
          preview: 'Hello there',
          updatedAt: '2026-04-13T00:00:00.000Z'
        }
      ],
      error: null
    });
    createConversationMessage.mockResolvedValue({
      data: {
        id: 'm-new',
        conversationId: 'c-new',
        userId: 'u1',
        role: 'user',
        content: 'Hello there',
        createdAt: '2026-04-13T00:00:00.000Z',
        updatedAt: '2026-04-13T00:00:00.000Z'
      },
      error: null
    });
    getConversationMessages.mockResolvedValue({ data: [], error: null });

    render(AppPage, {
      data: { session: { user: { email: 'user@example.com' } }, conversations: [] }
    });

    await page.getByRole('button', { name: 'New conversation' }).click();
    await page.getByRole('textbox', { name: 'Message' }).fill('Hello there');
    await page.getByRole('button', { name: 'Send' }).click();

    expect(createConversation).toHaveBeenCalledWith({ title: 'Hello there' });
    expect(createConversationMessage).toHaveBeenCalledWith('c-new', {
      role: 'user',
      content: 'Hello there'
    });
    await expect.element(page.getByRole('article').getByText('Hello there')).toBeInTheDocument();
  });

  it('refreshes conversations in parallel with sending the first message', async () => {
    const conversationList = [
      {
        id: 'c-new',
        title: 'Hello there',
        preview: 'Hello there',
        updatedAt: '2026-04-13T00:00:00.000Z'
      }
    ];
    const refreshDeferred = createDeferred<{ data: typeof conversationList; error: null }>();

    createConversation.mockResolvedValue({
      data: conversationList[0],
      error: null
    });
    getConversations.mockReturnValue(refreshDeferred.promise);
    createConversationMessage.mockResolvedValue({
      data: {
        id: 'm-new',
        conversationId: 'c-new',
        userId: 'u1',
        role: 'user',
        content: 'Hello there',
        createdAt: '2026-04-13T00:00:00.000Z',
        updatedAt: '2026-04-13T00:00:00.000Z'
      },
      error: null
    });

    render(AppPage, {
      data: { session: { user: { email: 'user@example.com' } }, conversations: [] }
    });

    await page.getByRole('textbox', { name: 'Message' }).fill('Hello there');
    await page.getByRole('button', { name: 'Send' }).click();

    expect(getConversations).toHaveBeenCalled();
    expect(createConversationMessage).toHaveBeenCalledWith('c-new', {
      role: 'user',
      content: 'Hello there'
    });

    refreshDeferred.resolve({ data: conversationList, error: null });

    await expect.element(page.getByRole('article').getByText('Hello there')).toBeInTheDocument();
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
