<script lang="ts">
	import { goto } from '$app/navigation';

	import { signIn, signUp } from '$lib/auth/api';
	import { validateAuthInput } from '$lib/auth/validators';

	type AuthMode = 'sign-in' | 'sign-up';
	type PageData = Record<string, never>;

	let { data: _data }: { data: PageData } = $props();

	let mode = $state<AuthMode>('sign-in');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let pending = $state(false);
	let message = $state('');
	let errors = $state<{ email?: string; password?: string }>({});

	async function handleSubmit() {
		errors = validateAuthInput({ email, password });
		message = '';

		if (Object.keys(errors).length > 0) {
			return;
		}

		pending = true;

		const result =
			mode === 'sign-up'
				? await signUp({ name: name.trim(), email, password })
				: await signIn({ email, password });

		pending = false;

		if (result.error) {
			message = result.error;
			return;
		}

		await goto('/app');
	}
</script>

<svelte:head>
	<title>NexChat Login</title>
</svelte:head>

<section class="auth-shell">
	<div class="auth-card">
		<h1>Welcome to NexChat</h1>
		<p>{mode === 'sign-in' ? 'Sign in to continue.' : 'Create your account to continue.'}</p>

		<div class="mode-switch" aria-label="Authentication mode">
			<button type="button" onclick={() => (mode = 'sign-in')} aria-pressed={mode === 'sign-in'}>
				Sign in
			</button>
			<button type="button" onclick={() => (mode = 'sign-up')} aria-pressed={mode === 'sign-up'}>
				Sign up
			</button>
		</div>

		{#if message}
			<p>{message}</p>
		{/if}

		{#if mode === 'sign-up'}
			<label>
				<span>Display name</span>
				<input bind:value={name} type="text" aria-label="Display name" />
			</label>
		{/if}

		<label>
			<span>Email</span>
			<input bind:value={email} type="email" aria-label="Email" />
		</label>
		{#if errors.email}
			<p>{errors.email}</p>
		{/if}

		<label>
			<span>Password</span>
			<input bind:value={password} type="password" aria-label="Password" />
		</label>
		{#if errors.password}
			<p>{errors.password}</p>
		{/if}

		<button type="button" onclick={handleSubmit} disabled={pending}>
			{pending ? 'Submitting…' : 'Continue'}
		</button>
	</div>
</section>
