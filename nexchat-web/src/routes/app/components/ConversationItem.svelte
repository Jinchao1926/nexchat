<script lang="ts">
  import type { Conversation } from '$lib/types/conversation';

  const {
    conversation,
    selected = false,
    onSelect
  }: {
    conversation: Conversation;
    selected?: boolean;
    onSelect: (conversationId: string) => void;
  } = $props();

  function formatUpdatedAt(value: string | null) {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  const updatedLabel = $derived(formatUpdatedAt(conversation.updatedAt));
</script>

<button
  type="button"
  class={`group relative flex w-full flex-col gap-2 overflow-hidden rounded-2xl border px-4 py-3 text-left transition ${
    selected
      ? 'border-primary/25 bg-primary/10 shadow-[0_12px_30px_rgba(79,70,229,0.12)]'
      : 'border-transparent bg-white/65 hover:border-border hover:bg-white hover:shadow-sm'
  }`}
  onclick={() => onSelect(conversation.id)}
  aria-pressed={selected}
>
  <span
    class={`absolute left-0 top-4 h-8 w-1 rounded-r-full transition ${
      selected ? 'bg-primary opacity-100' : 'bg-primary/40 opacity-0 group-hover:opacity-60'
    }`}
    aria-hidden="true"
  ></span>

  <div class="flex items-start justify-between gap-3">
    <div class="flex min-w-0 items-center gap-2">
      <span
        class={`size-2 shrink-0 rounded-full transition ${
          selected ? 'bg-primary' : 'bg-slate-300 group-hover:bg-primary/50'
        }`}
        aria-hidden="true"
      ></span>
      <p class="line-clamp-1 text-sm font-semibold text-slate-900">{conversation.title}</p>
    </div>
    {#if updatedLabel}
      <span class="shrink-0 text-xs text-slate-400">{updatedLabel}</span>
    {/if}
  </div>

  <p class={`line-clamp-2 pl-4 text-sm leading-5 ${selected ? 'text-slate-600' : 'text-slate-500'}`}>
    {conversation.preview}
  </p>
</button>
