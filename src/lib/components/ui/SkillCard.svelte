<script lang="ts">
  import { cn } from "$lib/utils/helpers";
  import Badge from "./Badge.svelte";

  interface Skill {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
  }

  interface Props {
    skill: Skill;
    class?: string;
    expanded?: boolean;
  }

  let {
    skill,
    class: className = "",
    expanded = $bindable(false),
  }: Props = $props();

  const categoryIcons: Record<string, string> = {
    skill: "⚡",
    tool: "🔧",
    automation: "🤖",
    integration: "🔗",
    workflow: "⚙️",
    default: "✨",
  };

  function getIcon(category?: string): string {
    return categoryIcons[category?.toLowerCase() || "default"] || categoryIcons.default;
  }

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<div class={cn("bg-card border border-border rounded-xl overflow-hidden transition-all duration-300", expanded && "shadow-lg shadow-black/20", className)}>
  <button
    onclick={toggleExpanded}
    class="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/30 transition-all duration-200 group"
  >
    <span class="text-2xl">{getIcon(skill.category)}</span>
    <div class="flex-1 min-w-0">
      <h4 class="font-medium text-foreground group-hover:text-primary transition-colors truncate">{skill.name}</h4>
      {#if skill.description && !expanded}
        <p class="text-sm text-muted-foreground truncate">{skill.description}</p>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      {#if skill.tags && skill.tags.length > 0}
        <div class="hidden sm:flex gap-1">
          {#each skill.tags.slice(0, 2) as tag}
            <Badge variant="outline" class="text-xs">{tag}</Badge>
          {/each}
        </div>
      {/if}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="text-muted-foreground transition-transform duration-300 {expanded ? 'rotate-180' : ''}"
      >
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </div>
  </button>

  {#if expanded}
    <div class="px-4 pb-4 pt-0 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
      <div class="pt-4">
        {#if skill.description}
          <p class="text-sm text-muted-foreground">{skill.description}</p>
        {/if}
        {#if skill.tags && skill.tags.length > 0}
          <div class="flex flex-wrap gap-1.5 mt-3">
            {#each skill.tags as tag}
              <Badge>{tag}</Badge>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
