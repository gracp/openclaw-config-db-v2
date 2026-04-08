<script lang="ts">
  import { cn } from "$lib/utils/helpers";

  interface Props {
    class?: string;
    variant?: "default" | "outline" | "success" | "warning" | "destructive";
    children?: import("svelte").Snippet;
  }

  let {
    class: className = "",
    variant = "default",
    children,
  }: Props = $props();

  const variants = {
    default: "bg-accent text-accent-foreground",
    outline: "bg-transparent border border-border text-muted-foreground",
    success: "bg-success/20 text-success border border-success/30",
    warning: "bg-warning/20 text-warning border border-warning/30",
    destructive: "bg-destructive/20 text-destructive border border-destructive/30",
  };

  const classes = $derived(cn(
    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-[0_0_12px_oklch(0.5_0.15_250/0.2)]",
    variants[variant],
    className
  ));
</script>

<span class={classes}>
  {@render children?.()}
</span>
