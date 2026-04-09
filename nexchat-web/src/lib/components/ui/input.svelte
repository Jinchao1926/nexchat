<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  import { cn } from '$lib/utils';

  type Props = HTMLInputAttributes & {
    class?: string;
  };

  let { class: className, value = $bindable(), ...rest }: Props = $props();
</script>

<input
  bind:value
  class={cn(
    'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-10 w-full min-w-0 rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50',
    className
  )}
  {...rest}
/>
