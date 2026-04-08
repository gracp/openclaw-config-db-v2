<script lang="ts">
  import { browser } from "$app/environment";
  import { cn } from "$lib/utils/helpers";
  import { tick } from "svelte";

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
    staggerDelay = 50,
    threshold = 0.1,
    once = true,
    children,
  }: Props = $props();

  let element: HTMLDivElement;
  let visible = $state(false);
  let hydrated = $state(false);

  const effectsMap: Record<string, string> = {
    "fade-up": "opacity-0 translate-y-3",
    "fade-in": "opacity-0",
    "slide-left": "opacity-0 -translate-x-4",
    "scale": "opacity-0 scale-[0.98]",
  };

  const effectsActiveMap: Record<string, string> = {
    "fade-up": "opacity-100 translate-y-0",
    "fade-in": "opacity-100",
    "slide-left": "opacity-100 translate-x-0",
    "scale": "opacity-100 scale-100",
  };

  const transitionsMap: Record<string, string> = {
    "fade-up": "transition-all duration-300 ease-out",
    "fade-in": "transition-all duration-200 ease-out",
    "slide-left": "transition-all duration-300 ease-out",
    "scale": "transition-all duration-200 ease-out",
  };

  // SSR: show content visible. Client: animate in via IntersectionObserver
  const initialClass = $derived(
    !hydrated || visible
      ? effectsActiveMap[animEffect]
      : effectsMap[animEffect]
  );
  const transitionClass = $derived(
    hydrated ? transitionsMap[animEffect] : ""
  );

  $effect(() => {
    if (!browser || !element) return;

    hydrated = true;

    // Force DOM update so the hidden state is painted first
    tick().then(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              visible = true;
              if (once) observer.unobserve(entry.target);
            } else if (!once) {
              visible = false;
            }
          }
        },
        { threshold }
      );

      observer.observe(element);

      return () => observer.disconnect();
    });
  });
</script>

<div
  bind:this={element}
  class={cn(
    initialClass,
    transitionClass,
    "motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:scale-100",
    stagger && "[&>[data-stagger-item]]:opacity-0 [&>[data-stagger-item]]:translate-y-2",
    className
  )}
  style={delay && hydrated ? `transition-delay: ${delay}ms` : ""}
>
  {@render children?.()}
</div>
