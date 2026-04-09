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
  it('renders the polished sign-in view by default', async () => {
    render(LoginPage, { data: {} });

    await expect.element(page.getByText('Welcome back')).toBeInTheDocument();
    await expect.element(page.getByText('Sign in to continue to NexChat.')).toBeInTheDocument();
    await expect
      .element(page.getByRole('group', { name: 'Authentication mode' }).getByRole('button', { name: 'Sign in' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  it('shows sign-up fields after toggling modes', async () => {
    render(LoginPage, { data: {} });

    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect.element(page.getByLabelText('Display name')).toBeInTheDocument();
    await expect
      .element(page.getByText('Create your account to start chatting.'))
      .toBeInTheDocument();
  });

  it('shows validation errors before submitting invalid credentials', async () => {
    render(LoginPage, { data: {} });

    await page.getByRole('form', { name: 'Authentication form' }).getByRole('button', { name: 'Sign in' }).click();
    await expect.element(page.getByText('Enter a valid email address')).toBeInTheDocument();
    await expect
      .element(page.getByText('Password must be at least 6 characters'))
      .toBeInTheDocument();
  });

  it('shows authentication failures inside an alert', async () => {
    signIn.mockResolvedValueOnce({ data: null, error: 'Wrong email or password' });

    render(LoginPage, { data: {} });

    await page.getByLabelText('Email').fill('user@example.com');
    await page.getByLabelText('Password').fill('123456');
    await page.getByRole('form', { name: 'Authentication form' }).getByRole('button', { name: 'Sign in' }).click();

    await expect.element(page.getByRole('alert')).toBeInTheDocument();
    await expect.element(page.getByText('Wrong email or password')).toBeInTheDocument();
  });

  it('submits sign-in credentials after validation passes', async () => {
    render(LoginPage, { data: {} });

    await page.getByLabelText('Email').fill('user@example.com');
    await page.getByLabelText('Password').fill('123456');
    await page.getByRole('form', { name: 'Authentication form' }).getByRole('button', { name: 'Sign in' }).click();

    expect(signIn).toHaveBeenCalledWith({ email: 'user@example.com', password: '123456' });
    expect(goto).toHaveBeenCalledWith('/app');
  });

  it('shows a pending state while signing in', async () => {
    let resolveSignIn: ((value: { data: { user: { email: string } }; error: null }) => void) | undefined;
    signIn.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );

    render(LoginPage, { data: {} });

    await page.getByLabelText('Email').fill('user@example.com');
    await page.getByLabelText('Password').fill('123456');
    await page.getByRole('form', { name: 'Authentication form' }).getByRole('button', { name: 'Sign in' }).click();

    await expect
      .element(page.getByRole('form', { name: 'Authentication form' }).getByRole('button', { name: 'Signing in…' }))
      .toBeDisabled();

    resolveSignIn?.({ data: { user: { email: 'user@example.com' } }, error: null });
  });
});
