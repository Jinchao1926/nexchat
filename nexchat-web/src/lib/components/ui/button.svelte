<script lang="ts">
  import { tv, type VariantProps } from 'tailwind-variants';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  import { cn } from '$lib/utils';

  const buttonVariants = tv({
    base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        outline:
          'border border-border bg-background/80 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'size-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  type Props = HTMLButtonAttributes &
    VariantProps<typeof buttonVariants> & {
      children?: Snippet;
      class?: string;
    };

  let { children, class: className, variant, size, ...rest }: Props = $props();
</script>

<button class={cn(buttonVariants({ variant, size }), className)} {...rest}>
  {@render children?.()}
</button>
