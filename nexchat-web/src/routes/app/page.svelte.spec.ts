import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

const { goto, signOut } = vi.hoisted(() => ({
	goto: vi.fn(),
	signOut: vi.fn().mockResolvedValue({ data: null, error: null })
}));

vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$lib/auth/api', () => ({ signOut }));

import AppPage from './+page.svelte';

describe('app page', () => {
	it('renders the logged-in placeholder', async () => {
		render(AppPage, {
			data: { session: { user: { email: 'user@example.com' } } }
		});

		await expect.element(page.getByText('App placeholder')).toBeInTheDocument();
		await expect.element(page.getByText('Logged in as user@example.com')).toBeInTheDocument();
	});

	it('calls signOut when logout is clicked', async () => {
		render(AppPage, {
			data: { session: { user: { email: 'user@example.com' } } }
		});

		await page.getByRole('button', { name: 'Logout' }).click();

		expect(signOut).toHaveBeenCalled();
		expect(goto).toHaveBeenCalledWith('/');
	});
});
