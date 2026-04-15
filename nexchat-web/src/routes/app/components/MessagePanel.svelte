<script lang="ts">
  import type { Conversation } from '$lib/types/conversation';
  import type { ConversationMessage } from '$lib/types/message';
  import MessageHeader from './MessageHeader.svelte';

  const {
    conversation = null,
    messages = [],
    loading = false,
    error = null,
    draft = '',
    sending = false,
    sendError = null,
    onToggleSidebar,
    onNewConversation,
    onDraftChange,
    onSend
  }: {
    conversation?: Conversation | null;
    messages?: ConversationMessage[];
    loading?: boolean;
    error?: string | null;
    draft?: string;
    sending?: boolean;
    sendError?: string | null;
    onToggleSidebar?: () => void;
    onNewConversation?: () => void;
    onDraftChange?: (value: string) => void;
    onSend?: () => void;
  } = $props();

  const newConversation = $derived(conversation === null);
  const title = $derived(conversation?.title ?? 'New conversation');
  const hasConversationMessages = $derived(conversation !== null || messages.length > 0);
  const centeredStateClass = 'flex flex-1 items-center justify-center';
  const mutedCenteredStateClass = `${centeredStateClass} text-sm text-slate-500`;
</script>

<section class="flex min-w-0 flex-1 flex-col bg-[#fafbff]">
  <MessageHeader
    {title}
    onToggleSidebar={() => onToggleSidebar?.()}
    onNewConversation={() => onNewConversation?.()}
  />

  <div class="flex min-h-0 flex-1 flex-col">
    {#if hasConversationMessages}
      <div class="flex min-h-0 flex-1 flex-col">
        {#if loading}
          <div class={mutedCenteredStateClass}>Loading messages…</div>
        {:else if error}
          <div class={centeredStateClass}>
            <div class="px-5 py-4 text-sm text-destructive">{error}</div>
          </div>
        {:else if messages.length === 0}
          <div class={mutedCenteredStateClass}>No messages yet in this conversation.</div>
        {:else}
          <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-6 sm:px-8">
            {#each [...messages].reverse() as message (message.id)}
              <article class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  class={`max-w-[78%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-primary/95 text-primary-foreground shadow-primary/10'
                      : 'rounded-bl-md border border-white/80 bg-white/95 text-slate-900 shadow-slate-200/60'
                  }`}
                >
                  <p class="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </div>
    {:else if newConversation}
      <div class={mutedCenteredStateClass}>
        <p class="text-base text-slate-500">Is there anything I can help with?</p>
      </div>
    {/if}

    <form
      class="shrink-0 bg-[#fafbff] px-6 pb-6 pt-4"
      aria-label="Message composer"
      onsubmit={(event) => {
        event.preventDefault();
        onSend?.();
      }}
    >
      <div
        class="rounded-[1.75rem] bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/70 transition focus-within:ring-slate-300"
      >
        <textarea
          class="min-h-12 w-full resize-none border-0 bg-transparent text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
          placeholder="Ask anything"
          value={draft}
          oninput={(event) => onDraftChange?.(event.currentTarget.value)}
          aria-label="Message"
          disabled={sending}
        ></textarea>

        <div class="mt-3 flex items-center justify-between gap-3">
          <p class={`text-xs ${sendError ? 'text-destructive' : 'text-slate-400'}`}>
            {sendError ??
              (newConversation ? 'Start a new conversation.' : 'Reply to this conversation.')}
          </p>
          <button
            type="submit"
            class="flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!draft.trim() || sending}
            aria-label="Send"
          >
            <svg
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M22 2 11 13"></path>
              <path d="m22 2-7 20-4-9-9-4Z"></path>
            </svg>
          </button>
        </div>
      </div>
    </form>
  </div>
</section>
