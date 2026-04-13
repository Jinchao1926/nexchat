<script lang="ts">
  import { goto } from '$app/navigation';

  import { createConversationMessage, getConversationMessages } from '$lib/api/modules/messages';
  import { signOut } from '$lib/auth/client';
  import ConversationSidebar from './components/ConversationSidebar.svelte';
  import CurrentUserCard from './components/CurrentUserCard.svelte';
  import MessagePanel from './components/MessagePanel.svelte';

  import type { Conversation } from '$lib/types/conversation';
  import type { ConversationMessage } from '$lib/types/message';
  import type { AppSession } from '$lib/types/session';

  interface AppPageData {
    session: AppSession;
    conversations: Conversation[];
  }

  const { data }: { data: AppPageData } = $props();
  let selectedConversationId = $state<string | null>(null);
  let messages = $state<ConversationMessage[]>([]);
  let messagesLoading = $state(false);
  let messagesError = $state<string | null>(null);
  let messageDraft = $state('');
  let messageSending = $state(false);
  let messageSendError = $state<string | null>(null);

  const selectedConversation = $derived(
    data.conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
  );

  let lastRequestedConversationId: string | null = null;

  async function handleLogout() {
    await signOut();
    await goto('/');
  }

  async function handleConversationSelect(conversationId: string) {
    selectedConversationId = conversationId;
    messages = [];
    messagesError = null;
    messageDraft = '';
    messageSendError = null;
    messagesLoading = true;

    lastRequestedConversationId = conversationId;

    const result = await getConversationMessages(conversationId);

    if (lastRequestedConversationId !== conversationId) {
      return;
    }

    messagesLoading = false;

    if (result.error) {
      messagesError = result.error;
      return;
    }

    messages = result.data ?? [];
  }

  async function handleDraftSend() {
    if (!selectedConversationId) {
      return;
    }

    const content = messageDraft.trim();

    if (!content || messageSending) {
      return;
    }

    messageSending = true;
    messageSendError = null;

    const result = await createConversationMessage(selectedConversationId, {
      role: 'user',
      content
    });

    messageSending = false;

    if (result.error) {
      messageSendError = result.error;
      return;
    }

    if (result.data) {
      messages = [result.data, ...messages];
      messageDraft = '';
    }
  }
</script>

<svelte:head>
  <title>NexChat App</title>
</svelte:head>

<section
  class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_28%),linear-gradient(180deg,_rgba(252,253,255,1),_rgba(243,246,255,1))] p-4 sm:p-6"
>
  <div class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:gap-6">
    <aside
      class="flex w-[21rem] shrink-0 flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <ConversationSidebar
        conversations={data.conversations}
        {selectedConversationId}
        onSelect={handleConversationSelect}
      />

      <CurrentUserCard user={data.session.user} onLogout={handleLogout} />
    </aside>

    <!-- <MessagePanel
      conversation={selectedConversation}
      {messages}
      loading={messagesLoading}
      error={messagesError}
      draft={messageDraft}
      sending={messageSending}
      sendError={messageSendError}
      onDraftChange={(value) => {
        messageDraft = value;
        messageSendError = null;
      }}
      onSend={handleDraftSend}
    /> -->
  </div>
</section>
