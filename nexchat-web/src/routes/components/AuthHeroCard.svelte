<script lang="ts">
  import { Bot, MessageCircle, Sparkles } from '@lucide/svelte';
  import { Card, Heading, P } from 'flowbite-svelte';

  const highlights = [
    {
      icon: Bot,
      title: 'AI replies that stay on topic',
      description: 'Draft, summarize, and move work forward without breaking the thread.'
    },
    {
      icon: MessageCircle,
      title: 'Threads your team can actually follow',
      description: 'Keep updates tidy, searchable, and easy to scan from first message to decision.'
    }
  ] as const;
</script>

<Card
  size="xl"
  class="hidden md:flex md:gap-2 md:flex-col md:justify-between w-full border-white/60 bg-white/70 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
>
  <div class="space-y-6">
    <div
      class="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
    >
      <Sparkles class="size-4" />
      AI-native team chat
    </div>
    <div class="space-y-4">
      <Heading
        tag="h1"
        class="max-w-lg text-4xl font-semibold tracking-tight text-balance text-slate-950"
      >
        Messaging that feels focused, fast, and ready for real work.
      </Heading>
      <P class="text-slate-600">
        NexChat keeps sign-in simple while giving your team a calm, polished place to collaborate.
      </P>
    </div>
  </div>

  <div class="grid gap-4">
    {#each highlights as highlight}
      <Card size="xl" class="border-slate-200/80 bg-white/80 p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-primary/10 p-2 text-primary">
            <highlight.icon class="size-5" />
          </div>
          <div>
            <Heading tag="h2" class="text-base font-medium text-slate-900"
              >{highlight.title}</Heading
            >
            <P class="text-sm text-slate-500">{highlight.description}</P>
          </div>
        </div>
      </Card>
    {/each}
  </div>
</Card>
