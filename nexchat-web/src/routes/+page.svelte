<script lang="ts">
  import { goto } from '$app/navigation';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import MessageCircle from '@lucide/svelte/icons/message-circle-more';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import { Alert, Button, ButtonGroup, Card, Heading, Input, Label, P } from 'flowbite-svelte';

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

  const title = $derived(mode === 'sign-in' ? 'Welcome back' : 'Join NexChat');
  const description = $derived(
    mode === 'sign-in'
      ? 'Sign in to continue to NexChat.'
      : 'Create your account to start chatting.'
  );
  const submitLabel = $derived(mode === 'sign-in' ? 'Sign in' : 'Create account');
  const pendingLabel = $derived(mode === 'sign-in' ? 'Signing in…' : 'Creating account…');
  const helperText = $derived(
    mode === 'sign-in'
      ? 'New here? Switch to sign up to create your workspace access.'
      : 'Already have an account? Switch back to sign in.'
  );
  const highlights = [
    {
      title: 'Conversation-first workspace',
      description: 'Clean threads, fast auth, zero clutter.'
    }
  ] as const;

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

<section
  class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(245,247,255,1))] px-4 py-10"
>
  <div class="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40"></div>

  <div class="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <Card class="hidden border-white/60 bg-white/70 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:flex xl:flex-col xl:justify-between">
      <div class="space-y-6">
        <div class="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles class="size-4" />
          AI-native team chat
        </div>
        <div class="space-y-4">
          <Heading tag="h1" class="max-w-lg text-4xl font-semibold tracking-tight text-balance text-slate-950">
            Messaging that feels focused, fast, and ready for real work.
          </Heading>
          <P class="max-w-md text-base leading-7 text-slate-600">
            NexChat keeps sign-in simple while giving your team a calm, polished place to
            collaborate.
          </P>
        </div>
      </div>

      <div class="grid gap-4">
        {#each highlights as highlight}
          <Card class="border-slate-200/80 bg-white/80 p-5 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="rounded-xl bg-primary/10 p-2 text-primary">
                <MessageCircle class="size-5" />
              </div>
              <div>
                <Heading tag="h2" class="text-base font-medium text-slate-900">{highlight.title}</Heading>
                <P class="text-sm text-slate-500">{highlight.description}</P>
              </div>
            </div>
          </Card>
        {/each}
      </div>
    </Card>

    <Card class="border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
      <div class="mb-8 flex items-center gap-3">
        <div class="rounded-2xl bg-primary/10 p-2 text-primary">
          <MessageCircle class="size-5" />
        </div>
        <div>
          <P class="text-sm font-medium text-slate-500">NexChat</P>
          <P class="text-sm text-slate-400">Secure workspace access</P>
        </div>
      </div>

      <div class="space-y-6">
        <div class="space-y-2">
          <Heading tag="h2" class="text-3xl font-semibold tracking-tight text-slate-950">{title}</Heading>
          <P class="text-sm leading-6 text-muted-foreground">{description}</P>
        </div>

        <ButtonGroup
          role="group"
          class="grid grid-cols-2 rounded-xl border border-border bg-muted/60 p-1"
          aria-label="Authentication mode"
        >
          <Button
            color={mode === 'sign-in' ? 'light' : 'alternative'}
            class={`border-0 text-sm transition-colors ${
              mode === 'sign-in'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onclick={() => (mode = 'sign-in')}
            aria-pressed={mode === 'sign-in'}
          >
            Sign in
          </Button>
          <Button
            color={mode === 'sign-up' ? 'light' : 'alternative'}
            class={`border-0 text-sm transition-colors ${
              mode === 'sign-up'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onclick={() => (mode = 'sign-up')}
            aria-pressed={mode === 'sign-up'}
          >
            Sign up
          </Button>
        </ButtonGroup>

        {#if message}
          <Alert color="red" class="text-sm" rounded>
            {message}
          </Alert>
        {/if}

        <form
          class="space-y-4"
          aria-label="Authentication form"
          onsubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          {#if mode === 'sign-up'}
            <Label class="grid gap-2 text-sm font-medium text-slate-700">
              <span>Display name</span>
              <Input
                bind:value={name}
                type="text"
                aria-label="Display name"
                placeholder="How should we call you?"
                autocomplete="nickname"
              />
            </Label>
          {/if}

          <div class="grid gap-2">
            <Label class="text-sm font-medium text-slate-700" for="email">Email</Label>
            <Input
              id="email"
              bind:value={email}
              type="email"
              aria-label="Email"
              placeholder="you@company.com"
              autocomplete="email"
            />
            {#if errors.email}
              <p class="text-sm text-destructive">{errors.email}</p>
            {/if}
          </div>

          <div class="grid gap-2">
            <Label class="text-sm font-medium text-slate-700" for="password">Password</Label>
            <Input
              id="password"
              bind:value={password}
              type="password"
              aria-label="Password"
              placeholder="At least 6 characters"
              autocomplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            />
            {#if errors.password}
              <p class="text-sm text-destructive">{errors.password}</p>
            {/if}
          </div>

          <Button type="submit" class="h-11 w-full text-sm" disabled={pending}>
            {pending ? pendingLabel : submitLabel}
            {#if !pending}
              <ArrowRight class="size-4" />
            {/if}
          </Button>
        </form>

        <P class="text-center text-sm text-muted-foreground">{helperText}</P>
      </div>
    </Card>
  </div>
</section>
