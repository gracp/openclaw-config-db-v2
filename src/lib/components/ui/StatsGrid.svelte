<script lang="ts">
  import { onMount } from "svelte";
  import { cn } from "$lib/utils/helpers";
  import AnimatedSection from "./AnimatedSection.svelte";

  interface Stat {
    label: string;
    value: number;
    suffix?: string;
    prefix?: string;
    icon?: string;
  }

  interface Props {
    stats: Stat[];
    class?: string;
    columns?: 2 | 3 | 4;
  }

  let {
    stats,
    class: className = "",
    columns = 4,
  }: Props = $props();

  let container: HTMLDivElement;
  let hasAnimated = false;

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            hasAnimated = true;
            animateCounters();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (container) observer.observe(container);

    return () => observer.disconnect();
  });

  let displayValues = $state(stats.map((s) => s.value));
  let animationComplete = $state(false);

  function animateCounters() {
    const duration = 800;
    const startTime = performance.now();
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      displayValues = stats.map((stat) => Math.round(stat.value * easedProgress));

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        displayValues = stats.map((stat) => stat.value);
        animationComplete = true;
      }
    }

    requestAnimationFrame(update);
  }
</script>

<div
  bind:this={container}
  class={cn("grid gap-4", gridCols[columns], className)}
>
  {#each stats as stat, i}
    <div class="bg-card border border-border rounded-xl p-4 md:p-6 text-center group hover:border-muted-foreground/50 transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.3)]">
      {#if stat.icon}
        <div class="text-3xl mb-2">{stat.icon}</div>
      {/if}
      <div class="text-2xl md:text-3xl font-bold text-foreground mb-1">
        {stat.prefix || ""}{displayValues[i].toLocaleString()}{stat.suffix || ""}
      </div>
      <div class="text-sm text-muted-foreground">{stat.label}</div>
    </div>
  {/each}
</div>
