<script lang="ts">
  import { cn } from "$lib/utils/helpers";

  interface Props {
    variant?: "default" | "ghost" | "outline" | "destructive";
    size?: "sm" | "default" | "lg";
    class?: string;
    href?: string;
    disabled?: boolean;
    onclick?: () => void;
    type?: "button" | "submit" | "reset";
    children?: import("svelte").Snippet;
  }

  let {
    variant = "default",
    size = "default",
    class: className = "",
    href,
    disabled = false,
    onclick,
    type = "button",
    children,
  }: Props = $props();

  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants = {
    default: "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]",
    ghost: "bg-transparent hover:bg-accent text-foreground active:scale-[0.98]",
    outline: "border border-border bg-transparent hover:bg-accent hover:border-muted-foreground text-foreground active:scale-[0.98]",
    destructive: "bg-destructive text-destructive-foreground hover:brightness-110 active:scale-[0.98]",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    default: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };

  const classes = $derived(cn(baseStyles, variants[variant], sizes[size], className));
</script>

{#if href}
  <a {href} class={classes} aria-disabled={disabled}>
    {@render children?.()}
  </a>
{:else}
  <button {type} {disabled} class={classes} {onclick}>
    {@render children?.()}
  </button>
{/if}
