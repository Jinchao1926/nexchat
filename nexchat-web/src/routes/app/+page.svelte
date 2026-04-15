<script lang="ts">
  import { goto } from '$app/navigation';

  import { getConversations } from '$lib/api/modules/conversations';
  import { getConversationMessages, streamAiChat } from '$lib/api/modules/messages';
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
  let conversations = $state<Conversation[]>([]);
  let selectedConversationId = $state<string | null>(null);

  let sidebarOpen = $state(true);

  let messages = $state<ConversationMessage[]>([]);
  let messagesLoading = $state(false);
  let messagesError = $state<string | null>(null);

  let messageDraft = $state('');
  let messageSending = $state(false);
  let messageSendError = $state<string | null>(null);

  const selectedConversation = $derived(
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? null
  );

  $effect(() => {
    conversations = data.conversations;
  });

  let lastRequestedConversationId: string | null = null;

  function resetMessagesState() {
    messages = [];
    messagesLoading = false;
    messagesError = null;
  }

  async function refreshConversations(
    nextSelectedConversationId: string | null = selectedConversationId
  ) {
    const result = await getConversations();

    if (!result.error) {
      conversations = result.data;
    }

    selectedConversationId = nextSelectedConversationId;
  }

  async function handleLogout() {
    await signOut();
    await goto('/');
  }

  async function handleConversationSelect(conversationId: string) {
    selectedConversationId = conversationId;
    resetMessagesState();
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

  function handleNewConversationStart() {
    selectedConversationId = null;
    resetMessagesState();
    messageDraft = '';
    messageSendError = null;
  }

  async function handleDraftSend() {
    const content = messageDraft.trim();

    if (!content || messageSending) {
      return;
    }

    messageSending = true;
    messageSendError = null;

    let streamConversationId = selectedConversationId;
    let userMessageId: string | null = null;
    let assistantMessageId: string | null = null;
    const now = new Date().toISOString();

    const result = await streamAiChat(
      {
        content,
        ...(streamConversationId ? { conversationId: streamConversationId } : undefined)
      },
      {
        onStart: (event) => {
          streamConversationId = String(event.conversationId);
          selectedConversationId = streamConversationId;
          userMessageId = String(event.userMessageId);
          assistantMessageId = String(event.assistantMessageId);

          messages = [
            {
              id: assistantMessageId,
              conversationId: streamConversationId,
              userId: data.session.user.email,
              role: 'assistant',
              content: '',
              createdAt: now,
              updatedAt: now
            },
            {
              id: userMessageId,
              conversationId: streamConversationId,
              userId: data.session.user.email,
              role: 'user',
              content,
              createdAt: now,
              updatedAt: now
            },
            ...messages
          ];
          messageDraft = '';
          void refreshConversations(streamConversationId);
        },
        onDelta: (event) => {
          if (!assistantMessageId) {
            return;
          }

          messages = messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: `${message.content}${event.content}`,
                  updatedAt: new Date().toISOString()
                }
              : message
          );
        },
        onDone: () => {
          if (streamConversationId) {
            void refreshConversations(streamConversationId);
          }
        },
        onError: (event) => {
          messageSendError = event.message;
        }
      }
    );

    messageSending = false;

    if (result.error) {
      messageSendError = result.error;
    }
  }
</script>

<svelte:head>
  <title>NexChat App</title>
</svelte:head>

<section class="h-screen">
  <div class="flex h-full bg-[#f7f8fc]">
    {#if sidebarOpen}
      <aside
        class="flex h-full w-80 shrink-0 flex-col border-r border-slate-200/70 bg-[#f4f6fb]"
        aria-label="Conversation sidebar"
      >
        <ConversationSidebar
          {conversations}
          {selectedConversationId}
          onSelect={handleConversationSelect}
        />

        <CurrentUserCard user={data.session.user} onLogout={handleLogout} />
      </aside>
    {/if}

    <MessagePanel
      conversation={selectedConversation}
      {messages}
      loading={messagesLoading}
      error={messagesError}
      draft={messageDraft}
      sending={messageSending}
      sendError={messageSendError}
      onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
      onNewConversation={handleNewConversationStart}
      onDraftChange={(value: string) => {
        messageDraft = value;
        messageSendError = null;
      }}
      onSend={handleDraftSend}
    />
  </div>
</section>
