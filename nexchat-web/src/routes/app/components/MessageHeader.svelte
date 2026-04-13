<script lang="ts">
  const {
    title,
    onToggleSidebar,
    onNewConversation
  }: {
    title: string;
    onToggleSidebar?: () => void;
    onNewConversation?: () => void;
  } = $props();
</script>

<header class="flex h-14 shrink-0 items-center bg-[#fafbff]">
  <div class="flex shrink-0 items-center px-1">
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900"
      aria-label="Toggle sidebar"
      onclick={() => onToggleSidebar?.()}
    >
      <svg
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
        <path d="M9 4v16"></path>
      </svg>
    </button>
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900"
      aria-label="New conversation"
      onclick={() => onNewConversation?.()}
    >
      <svg
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"></path>
      </svg>
    </button>
  </div>

  <div class="flex min-w-0 flex-1 items-center justify-center px-4">
    <h2 class="truncate text-sm font-semibold text-slate-950">{title}</h2>
  </div>
</header>
