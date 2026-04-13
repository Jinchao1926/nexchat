<script lang="ts">
  import ConversationItem from './ConversationItem.svelte';

  import type { Conversation } from '$lib/types/conversation';

  const {
    conversations,
    selectedConversationId = null,
    onSelect
  }: {
    conversations: Conversation[];
    selectedConversationId?: string | null;
    onSelect: (conversationId: string) => void;
  } = $props();
</script>

<section class="flex min-h-0 flex-1 flex-col">
  <div class="px-5 pb-4 pt-5">
    <h1 class="text-lg font-semibold tracking-tight text-slate-950">NexChat</h1>
    <p class="mt-1 text-sm text-slate-500">Conversations</p>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
    <div class="space-y-1.5">
      {#each conversations as conversation (conversation.id)}
        <ConversationItem
          {conversation}
          selected={conversation.id === selectedConversationId}
          {onSelect}
        />
      {/each}
    </div>
  </div>
</section>
