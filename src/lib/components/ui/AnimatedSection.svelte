<script lang="ts">
  import { onMount } from "svelte";
  import { cn } from "$lib/utils/helpers";

  interface Props {
    class?: string;
    delay?: number;
    animEffect?: "fade-up" | "fade-in" | "slide-left" | "scale";
    stagger?: boolean;
    staggerDelay?: number;
    threshold?: number;
    once?: boolean;
    children?: import("svelte").Snippet;
  }

  let {
    class: className = "",
    delay = 0,
    animEffect = "fade-up",
    stagger = false,
    staggerDelay = 100,
    threshold = 0.1,
    once = true,
    children,
  }: Props = $props();

  let element: HTMLDivElement;
  let visible = $state(false);
  let hasAnimated = $state(false);

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (once && hasAnimated) return;
            visible = true;
            hasAnimated = true;
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            visible = false;
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  });

  const effectsMap: Record<string, string> = {
    "fade-up": "opacity-0 translate-y-6",
    "fade-in": "opacity-0",
    "slide-left": "opacity-0 -translate-x-8",
    "scale": "opacity-0 scale-95",
  };

  const effectsActiveMap: Record<string, string> = {
    "fade-up": "opacity-100 translate-y-0",
    "fade-in": "opacity-100",
    "slide-left": "opacity-100 translate-x-0",
    "scale": "opacity-100 scale-100",
  };

  const transitionsMap: Record<string, string> = {
    "fade-up": "transition-all duration-700 ease-out",
    "fade-in": "transition-all duration-500 ease-out",
    "slide-left": "transition-all duration-600 ease-out",
    "scale": "transition-all duration-500 ease-out",
  };

  const initialClass = $derived(
    visible ? effectsActiveMap[animEffect] : effectsMap[animEffect]
  );
  const transitionClass = $derived(transitionsMap[animEffect]);
</script>

<div
  bind:this={element}
  class={cn(
    initialClass,
    transitionClass,
    stagger && "[&>[data-stagger-item]]:opacity-0 [&>[data-stagger-item]]:translate-y-4",
    className
  )}
  style={delay ? `transition-delay: ${delay}ms` : ""}
>
  {@render children?.()}
</div>
