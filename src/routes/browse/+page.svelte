<script lang="ts">
  import { goto } from "$app/navigation";
  import Container from "$lib/components/ui/Container.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import AnimatedSection from "$lib/components/ui/AnimatedSection.svelte";
  import ConfigCard from "$lib/components/ui/ConfigCard.svelte";
  import Skeleton from "$lib/components/ui/Skeleton.svelte";

  let { data } = $props();

  let searchValue = $state(data.search);
  let selectedTags = $state<string[]>(data.tag ? [data.tag] : []);
  let sortBy = $state(data.sortBy);
  let debounceTimer: ReturnType<typeof setTimeout>;

  const sortOptions = [
    { value: "created", label: "Newest" },
    { value: "stars", label: "Most Stars" },
    { value: "downloads", label: "Most Downloads" },
  ];

  $effect(() => {
    searchValue = data.search;
    selectedTags = data.tag ? [data.tag] : [];
    sortBy = data.sortBy;
  });

  function handleSearch(e: Event) {
    const target = e.target as HTMLInputElement;
    searchValue = target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateUrl();
    }, 300);
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
    updateUrl();
  }

  function handleSortChange(e: Event) {
    sortBy = (e.target as HTMLSelectElement).value;
    updateUrl();
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (selectedTags.length > 0) params.set("tag", selectedTags[0]);
    if (sortBy !== "created") params.set("sortBy", sortBy);
    params.delete("page");

    const queryString = params.toString();
    goto(`/browse${queryString ? `?${queryString}` : ""}`, { keepFocus: true });
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (selectedTags.length > 0) params.set("tag", selectedTags[0]);
    if (sortBy !== "created") params.set("sortBy", sortBy);
    params.set("page", p.toString());
    goto(`/browse?${params}`, { keepFocus: true });
  }

  const totalPages = $derived(Math.ceil(data.total / 12) || 1);
  const allTags = $derived(Object.values(data.tags).flat());
</script>

<svelte:head>
  <title>Browse Configs — OpenClaw ConfigDB</title>
</svelte:head>

<div class="py-12">
  <Container>
    <!-- Page Header -->
    <AnimatedSection animEffect="fade-up" class="mb-10">
      <h1 class="text-4xl md:text-5xl font-bold mb-3">Browse Configs</h1>
      <p class="text-muted-foreground text-lg">
        Discover {data.total} community-powered OpenClaw configurations
      </p>
    </AnimatedSection>

    <!-- Search & Filters -->
    <AnimatedSection animEffect="fade-up" delay={100} class="mb-8 space-y-4">
      <!-- Search Bar -->
      <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div class="relative flex-1 max-w-md">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
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
            placeholder="Search configs..."
            bind:value={searchValue}
            oninput={handleSearch}
            class="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25)]"
          />
        </div>

        <!-- Sort Dropdown -->
        <div class="flex items-center gap-2">
          <label for="sort-select" class="text-sm text-muted-foreground">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onchange={handleSortChange}
            class="px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {#each sortOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Tag Filters -->
      {#if allTags.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each allTags as tag}
            <button
              onclick={() => toggleTag(tag)}
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border {selectedTags.includes(tag)
                ? 'bg-accent border-ring text-foreground'
                : 'bg-accent/50 text-muted-foreground border-transparent hover:bg-accent hover:text-foreground'}"
            >
              {tag}
            </button>
          {/each}
          {#if selectedTags.length > 0}
            <button
              onclick={() => { selectedTags = []; updateUrl(); }}
              class="px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              Clear all
            </button>
          {/if}
        </div>
      {/if}
    </AnimatedSection>

    <!-- Results Grid -->
    {#if data.configs.length > 0}
      <AnimatedSection animEffect="fade-up" delay={200}>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {#each data.configs as config, i}
            <ConfigCard {config} index={i} />
          {/each}
        </div>
      </AnimatedSection>

      <!-- Pagination -->
      {#if totalPages > 1}
        <AnimatedSection animEffect="fade-up" class="flex items-center justify-center gap-2 mb-12">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onclick={() => goToPage(data.page - 1)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Previous
          </Button>

          <div class="flex items-center gap-1">
            {#each Array(Math.min(totalPages, 7)) as _, i}
              {@const p = i + 1}
              <button
                onclick={() => goToPage(p)}
                class="w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 {data.page === p
                  ? 'bg-accent text-foreground ring-2 ring-ring'
                  : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground'}"
              >
                {p}
              </button>
            {/each}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= totalPages}
            onclick={() => goToPage(data.page + 1)}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </Button>
        </AnimatedSection>
      {/if}
    {:else}
      <!-- Empty State -->
      <AnimatedSection animEffect="fade-up">
        <div class="text-center py-20">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-2xl font-semibold mb-2">No configs found</h3>
          <p class="text-muted-foreground mb-6 max-w-md mx-auto">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <div class="flex gap-3 justify-center">
            <Button onclick={() => { searchValue = ""; selectedTags = []; updateUrl(); }}>
              Clear filters
            </Button>
            <Button href="/upload" variant="outline">Upload a Config</Button>
          </div>
        </div>
      </AnimatedSection>
    {/if}
  </Container>
</div>
