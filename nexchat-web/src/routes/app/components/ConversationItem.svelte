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
</script>

<button
  type="button"
  class={`group relative flex w-full flex-col gap-2 overflow-hidden rounded-2xl px-4 py-3 text-left transition ${
    selected ? 'bg-white shadow-sm ring-1 ring-slate-200/80' : 'bg-transparent hover:bg-white/80'
  }`}
  onclick={() => onSelect(conversation.id)}
  aria-pressed={selected}
>
  <div class="flex items-center gap-3">
    <div
      class={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition ${
        selected
          ? 'bg-primary/10 text-primary'
          : 'bg-white/80 text-slate-400 group-hover:text-primary/70'
      }`}
      aria-hidden="true"
    >
      <svg
        class="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M7 10h10"></path>
        <path d="M7 14h6"></path>
        <path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        ></path>
      </svg>
    </div>

    <div class="min-w-0 flex-1">
      <p class="line-clamp-1 text-sm font-semibold text-slate-900">{conversation.title}</p>
      <p
        class={`mt-1 line-clamp-2 text-sm leading-5 ${selected ? 'text-slate-600' : 'text-slate-500'}`}
      >
        {conversation.preview}
      </p>
    </div>
  </div>
</button>
