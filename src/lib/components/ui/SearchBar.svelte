<script lang="ts">
  import { cn } from "$lib/utils/helpers";
  import Input from "./Input.svelte";

  interface Props {
    class?: string;
    placeholder?: string;
    value?: string;
    onsearch?: (query: string) => void;
  }

  let {
    class: className = "",
    placeholder = "Search configs...",
    value = $bindable(""),
    onsearch,
  }: Props = $props();

  let expanded = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onsearch?.(value);
    }, 300);
  }

  function handleFocus() {
    expanded = true;
  }

  function handleBlur() {
    expanded = false;
  }

  function handleClear() {
    value = "";
    onsearch?.("");
  }
</script>

<div class={cn("relative transition-all duration-300", expanded ? "w-full md:w-96" : "w-full md:w-64", className)}>
  <div class="relative flex items-center">
    <svg
      class="absolute left-3 w-5 h-5 text-muted-foreground pointer-events-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
    <input
      type="search"
      {placeholder}
      bind:value
      oninput={handleInput}
      onfocus={handleFocus}
      onblur={handleBlur}
      class={cn(
        "w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
        "hover:border-muted-foreground/50"
      )}
    />
    {#if value}
      <button
        onclick={handleClear}
        class="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
        aria-label="Clear search"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    {/if}
  </div>
</div>
