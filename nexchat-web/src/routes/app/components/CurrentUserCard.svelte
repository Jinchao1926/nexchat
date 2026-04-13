<script lang="ts">
  import LogOut from '@lucide/svelte/icons/log-out';

  import type { AppUser } from '$lib/types/session';

  const {
    user,
    onLogout
  }: {
    user: AppUser;
    onLogout: () => Promise<void> | void;
  } = $props();

  function getDisplayName(user: AppUser) {
    const trimmedName = user.name?.trim();

    if (trimmedName) {
      return trimmedName;
    }

    return user.email.split('@')[0] ?? user.email;
  }

  function getInitials(user: AppUser) {
    const source = getDisplayName(user)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? '')
      .join('');

    return source || '?';
  }

  const displayName = $derived(getDisplayName(user));
  const initials = $derived(getInitials(user));
</script>

<section
  class="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur"
>
  <div class="flex items-center gap-3">
    {#if user.image}
      <img src={user.image} alt={displayName} class="size-11 rounded-2xl object-cover" />
    {:else}
      <div
        class="flex size-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        {initials}
      </div>
    {/if}

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold text-slate-950">{displayName}</p>
      <p class="truncate text-xs text-slate-400">{user.email}</p>
    </div>

    <button
      type="button"
      class="flex size-10 items-center justify-center rounded-2xl border border-border text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
      onclick={() => onLogout()}
      aria-label="Logout"
      title="Logout"
    >
      <LogOut class="size-4" />
    </button>
  </div>
</section>
