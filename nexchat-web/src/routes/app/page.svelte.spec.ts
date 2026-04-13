import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

const { goto, signOut } = vi.hoisted(() => ({
  goto: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ data: null, error: null })
}));

vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$lib/auth/client', () => ({ signOut }));

import AppPage from './+page.svelte';

describe('app page', () => {
  it('renders the conversation shell for logged-in users', async () => {
    render(AppPage, {
      data: { session: { user: { email: 'user@example.com' } }, conversations: [] }
    });

    await expect.element(page.getByText('Select a conversation')).toBeInTheDocument();
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
});
