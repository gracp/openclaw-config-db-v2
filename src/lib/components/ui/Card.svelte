<script lang="ts">
  import { cn } from "$lib/utils/helpers";

  interface Props {
    class?: string;
    hover?: boolean;
    children?: import("svelte").Snippet;
  }

  let {
    class: className = "",
    hover = true,
    children,
  }: Props = $props();
</script>

<div
  class={cn(
    "bg-card border border-border rounded-xl p-6 transition-all duration-300",
    hover && "hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 hover:border-muted-foreground/50 hover:glow",
    className
  )}
>
  {@render children?.()}
</div>
