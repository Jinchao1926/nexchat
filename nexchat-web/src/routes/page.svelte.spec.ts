import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

const { goto, signIn, signUp } = vi.hoisted(() => ({
	goto: vi.fn(),
	signIn: vi.fn().mockResolvedValue({ data: { user: { email: 'user@example.com' } }, error: null }),
	signUp: vi.fn().mockResolvedValue({ data: { user: { email: 'user@example.com' } }, error: null })
}));

vi.mock('$lib/auth/api', () => ({ signIn, signUp }));
vi.mock('$app/navigation', () => ({ goto }));

import LoginPage from './+page.svelte';

describe('login page', () => {
	it('shows sign-up fields after toggling modes', async () => {
		render(LoginPage, { data: {} });

		await page.getByRole('button', { name: 'Sign up' }).click();
		await expect.element(page.getByLabelText('Display name')).toBeInTheDocument();
	});

	it('shows validation errors before submitting invalid credentials', async () => {
		render(LoginPage, { data: {} });

		await page.getByRole('button', { name: 'Continue' }).click();
		await expect.element(page.getByText('Enter a valid email address')).toBeInTheDocument();
		await expect
			.element(page.getByText('Password must be at least 6 characters'))
			.toBeInTheDocument();
	});

	it('submits sign-in credentials after validation passes', async () => {
		render(LoginPage, { data: {} });

		await page.getByLabelText('Email').fill('user@example.com');
		await page.getByLabelText('Password').fill('123456');
		await page.getByRole('button', { name: 'Continue' }).click();

		expect(signIn).toHaveBeenCalledWith({ email: 'user@example.com', password: '123456' });
		expect(goto).toHaveBeenCalledWith('/app');
	});
});
