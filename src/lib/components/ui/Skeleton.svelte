<script lang="ts">
  import { cn } from "$lib/utils/helpers";

  interface Props {
    class?: string;
    variant?: "text" | "circular" | "card";
  }

  let {
    class: className = "",
    variant = "text",
  }: Props = $props();

  const variants = {
    text: "h-4 rounded",
    circular: "rounded-full",
    card: "h-32 rounded-xl",
  };
</script>

<div class={cn("shimmer", variants[variant], className)} aria-hidden="true"></div>
