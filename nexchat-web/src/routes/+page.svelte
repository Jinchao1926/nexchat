<script lang="ts">
  import { goto } from '$app/navigation';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import MessageCircle from '@lucide/svelte/icons/message-circle-more';
  import { Alert, Button, ButtonGroup, Card, Heading, Input, Label, P } from 'flowbite-svelte';

  import { signIn, signUp } from '$lib/auth/api';
  import { validateAuthInput } from '$lib/auth/validators';
  import AuthHeroCard from './components/AuthHeroCard.svelte';

  type AuthMode = 'sign-in' | 'sign-up';
  type PageData = Record<string, never>;

  let { data: _data = {} as PageData }: { data?: PageData } = $props();

  const authCopy = {
    'sign-in': {
      title: 'Welcome back',
      description: 'Sign in to continue to NexChat.',
      submitLabel: 'Sign in',
      pendingLabel: 'Signing in…',
      helperText: 'New here? Switch to sign up to create your workspace access.'
    },
    'sign-up': {
      title: 'Join NexChat',
      description: 'Create your account to start chatting.',
      submitLabel: 'Create account',
      pendingLabel: 'Creating account…',
      helperText: 'Already have an account? Switch back to sign in.'
    }
  } as const;

  const authModes = [
    { value: 'sign-in', label: 'Sign in' },
    { value: 'sign-up', label: 'Sign up' }
  ] as const satisfies readonly { value: AuthMode; label: string }[];

  let mode = $state<AuthMode>('sign-in');
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let pending = $state(false);
  let message = $state('');
  let errors = $state<{ email?: string; password?: string }>({});

  const copy = $derived(authCopy[mode]);

  function getModeButtonClass(value: AuthMode) {
    return `border-0 text-sm transition-colors ${
      mode === value
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'
    }`;
  }

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
  class="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(245,247,255,1))] px-4 py-10"
>
  <div class="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <AuthHeroCard />

    <Card
      size="xl"
      class="border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8"
    >
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
          <Heading tag="h2" class="text-3xl font-semibold tracking-tight text-slate-950"
            >{copy.title}</Heading
          >
          <P class="text-sm leading-6 text-muted-foreground">{copy.description}</P>
        </div>

        <ButtonGroup
          role="group"
          class="grid grid-cols-2 rounded-xl border border-border bg-muted/60 p-1"
          aria-label="Authentication mode"
        >
          {#each authModes as authMode}
            <Button
              color={mode === authMode.value ? 'light' : 'alternative'}
              class={getModeButtonClass(authMode.value)}
              onclick={() => (mode = authMode.value)}
              aria-pressed={mode === authMode.value}
            >
              {authMode.label}
            </Button>
          {/each}
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
            <div class="space-y-2">
              <Label class="text-sm font-medium text-slate-700" for="name">Display name</Label>
              <Input
                id="name"
                bind:value={name}
                type="text"
                aria-label="Display name"
                placeholder="How should we call you?"
                autocomplete="nickname"
              />
            </div>
          {/if}

          <div class="space-y-2">
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

          <div class="space-y-2">
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

          <Button
            type="submit"
            class="h-11 w-full bg-primary text-sm text-primary-foreground shadow-sm hover:bg-primary/90 focus-within:ring-ring"
            disabled={pending}
          >
            {pending ? copy.pendingLabel : copy.submitLabel}
            {#if !pending}
              <ArrowRight class="size-4" />
            {/if}
          </Button>
        </form>

        <P class="text-center text-sm text-muted-foreground">{copy.helperText}</P>
      </div>
    </Card>
  </div>
</section>
