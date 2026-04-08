<script lang="ts">
  interface Props {
    class?: string;
    size?: "default" | "wide" | "full";
    children?: import("svelte").Snippet;
  }

  let {
    class: className = "",
    size = "default",
    children,
  }: Props = $props();

  const sizes = {
    default: "max-w-7xl",
    wide: "max-w-[90rem]",
    full: "max-w-full",
  };
</script>

<div class="mx-auto px-4 sm:px-6 lg:px-8 {sizes[size]} {className}">
  {@render children?.()}
</div>
