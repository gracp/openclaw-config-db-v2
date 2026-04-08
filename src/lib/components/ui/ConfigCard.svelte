<script lang="ts">
  import { cn } from "$lib/utils/helpers";
  import Badge from "./Badge.svelte";
  import Card from "./Card.svelte";

  interface Config {
    id: string;
    name: string;
    description?: string | null;
    author?: string | null;
    stars: number;
    downloads: number;
    tags: string[];
    sourceType: "github" | "upload" | "community";
    isFeatured?: boolean;
    fileCount?: number;
  }

  interface Props {
    config: Config;
    class?: string;
    index?: number;
  }

  let {
    config,
    class: className = "",
    index = 0,
  }: Props = $props();

  const sourceTypeLabels = {
    github: "GitHub",
    upload: "Upload",
    community: "Community",
  };

  function formatNumber(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  }
</script>

<a
  href="/config/{config.id}"
  class="group block"
  style="animation-delay: {index * 80}ms"
  data-stagger-item
>
  <Card hover class={cn("h-full relative overflow-hidden", className)}>
    {#if config.isFeatured}
      <div class="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-primary/20 to-transparent rounded-bl-lg">
        <Badge variant="success">Featured</Badge>
      </div>
    {/if}

    <div class="flex flex-col gap-3">
      <!-- Source badge -->
      <div class="flex items-center justify-between">
        <Badge variant="outline" class="text-xs">
          {sourceTypeLabels[config.sourceType]}
        </Badge>
        {#if config.author}
          <span class="text-xs text-muted-foreground truncate max-w-[120px]">{config.author}</span>
        {/if}
      </div>

      <!-- Name & Description -->
      <div>
        <h3 class="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {config.name}
        </h3>
        {#if config.description}
          <p class="text-sm text-muted-foreground mt-1 line-clamp-2">{config.description}</p>
        {/if}
      </div>

      <!-- Tags -->
      {#if config.tags.length > 0}
        <div class="flex flex-wrap gap-1.5">
          {#each config.tags.slice(0, 4) as tag}
            <Badge class="text-xs">{tag}</Badge>
          {/each}
          {#if config.tags.length > 4}
            <Badge variant="outline" class="text-xs">+{config.tags.length - 4}</Badge>
          {/if}
        </div>
      {/if}

      <!-- Stats -->
      <div class="flex items-center gap-4 pt-2 border-t border-border/50 mt-auto">
        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>{formatNumber(config.stars)}</span>
        </div>
        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>{formatNumber(config.downloads)}</span>
        </div>
        {#if config.fileCount !== undefined}
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{config.fileCount}</span>
          </div>
        {/if}
      </div>

      <!-- View Arrow (shows on hover) -->
      <div class="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
        <span class="text-primary text-sm font-medium flex items-center gap-1">
          View
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </span>
      </div>
    </div>
  </Card>
</a>
