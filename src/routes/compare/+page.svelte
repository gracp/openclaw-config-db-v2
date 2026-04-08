<script lang="ts">
  import Container from "$lib/components/ui/Container.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import AnimatedSection from "$lib/components/ui/AnimatedSection.svelte";
  import StatsGrid from "$lib/components/ui/StatsGrid.svelte";

  interface Config {
    id: string;
    name: string;
    description?: string | null;
    stars: number;
    downloads: number;
    tags: string[];
    files: Array<{ filename: string; content: string; fileType: string }>;
  }

  let configs: Config[] = $state([]);
  let configA: Config | null = $state(null);
  let configB: Config | null = $state(null);
  let loading = $state(true);
  let comparing = $state(false);

  $effect(() => {
    loadConfigs();
  });

  async function loadConfigs() {
    try {
      const res = await fetch("/api/configs?limit=50");
      const data = await res.json();
      configs = data.configs || [];
    } catch (err) {
      console.error("Failed to load configs:", err);
    } finally {
      loading = false;
    }
  }

  async function loadConfigDetails(id: string): Promise<Config | null> {
    try {
      const res = await fetch(`/api/configs/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function selectConfigA(id: string) {
    comparing = true;
    configA = await loadConfigDetails(id);
    comparing = false;
  }

  async function selectConfigB(id: string) {
    comparing = true;
    configB = await loadConfigDetails(id);
    comparing = false;
  }

  function getUniqueFiles(config: Config): string[] {
    return config.files.map((f) => f.filename);
  }

  function getCommonFiles(): string[] {
    if (!configA || !configB) return [];
    const filesA = new Set(getUniqueFiles(configA));
    return getUniqueFiles(configB).filter((f) => filesA.has(f));
  }

  function getUniqueToA(): string[] {
    if (!configA || !configB) return [];
    const filesB = new Set(getUniqueFiles(configB));
    return getUniqueFiles(configA).filter((f) => !filesB.has(f));
  }

  function getUniqueToB(): string[] {
    if (!configA || !configB) return [];
    const filesA = new Set(getUniqueFiles(configA));
    return getUniqueFiles(configB).filter((f) => !filesA.has(f));
  }

  function getTotalSize(config: Config): number {
    return config.files.reduce((acc, f) => acc + (f.content?.length || 0), 0);
  }
</script>

<svelte:head>
  <title>Compare Configs — OpenClaw ConfigDB</title>
</svelte:head>

<div class="py-12">
  <Container>
    <AnimatedSection animEffect="fade-up" class="mb-12">
      <h1 class="text-4xl font-bold mb-3">Compare Configurations</h1>
      <p class="text-muted-foreground text-lg">
        Side-by-side comparison of two OpenClaw agent configurations
      </p>
    </AnimatedSection>

    <!-- Config Selectors -->
    <AnimatedSection animEffect="fade-up" delay={100} class="mb-12">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Config A -->
        <Card>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">A</div>
            <h3 class="font-semibold">First Configuration</h3>
          </div>
          {#if loading}
            <div class="h-10 bg-muted/30 rounded animate-pulse"></div>
          {:else}
            <select
              onchange={(e) => selectConfigA((e.target as HTMLSelectElement).value)}
              class="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <option value="">Select a config...</option>
              {#each configs as config}
                <option value={config.id} disabled={configB?.id === config.id}>
                  {config.name}
                </option>
              {/each}
            </select>
          {/if}
        </Card>

        <!-- Config B -->
        <Card>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">B</div>
            <h3 class="font-semibold">Second Configuration</h3>
          </div>
          {#if loading}
            <div class="h-10 bg-muted/30 rounded animate-pulse"></div>
          {:else}
            <select
              onchange={(e) => selectConfigB((e.target as HTMLSelectElement).value)}
              class="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <option value="">Select a config...</option>
              {#each configs as config}
                <option value={config.id} disabled={configA?.id === config.id}>
                  {config.name}
                </option>
              {/each}
            </select>
          {/if}
        </Card>
      </div>
    </AnimatedSection>

    {#if configA && configB}
      <!-- Comparison Results -->
      <div class="space-y-8">
        <!-- Stats Comparison -->
        <AnimatedSection animEffect="fade-up">
          <h2 class="text-2xl font-bold mb-6">Statistics Comparison</h2>
          <div class="grid grid-cols-2 gap-6">
            <Card>
              <h3 class="font-semibold mb-4 truncate">{configA.name}</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Files</span>
                  <span class="font-semibold">{configA.files.length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Size</span>
                  <span class="font-semibold">{Math.round(getTotalSize(configA) / 1024)}KB</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Stars</span>
                  <span class="font-semibold">{configA.stars}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Downloads</span>
                  <span class="font-semibold">{configA.downloads}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Tags</span>
                  <span class="font-semibold">{configA.tags.length}</span>
                </div>
              </div>
            </Card>
            <Card>
              <h3 class="font-semibold mb-4 truncate">{configB.name}</h3>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Files</span>
                  <span class="font-semibold">{configB.files.length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Size</span>
                  <span class="font-semibold">{Math.round(getTotalSize(configB) / 1024)}KB</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Stars</span>
                  <span class="font-semibold">{configB.stars}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Downloads</span>
                  <span class="font-semibold">{configB.downloads}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Tags</span>
                  <span class="font-semibold">{configB.tags.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </AnimatedSection>

        <!-- File Comparison -->
        <AnimatedSection animEffect="fade-up" delay={100}>
          <h2 class="text-2xl font-bold mb-6">File Structure Comparison</h2>
          <Card>
            <div class="space-y-6">
              <!-- Common Files -->
              {#if getCommonFiles().length > 0}
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <h3 class="font-medium text-success">Shared Files ({getCommonFiles().length})</h3>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {#each getCommonFiles() as file}
                      <Badge variant="success" class="font-mono text-xs">{file}</Badge>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Unique to A -->
              {#if getUniqueToA().length > 0}
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">A</div>
                    <h3 class="font-medium">Only in {configA.name} ({getUniqueToA().length})</h3>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {#each getUniqueToA() as file}
                      <Badge class="font-mono text-xs">{file}</Badge>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Unique to B -->
              {#if getUniqueToB().length > 0}
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">B</div>
                    <h3 class="font-medium">Only in {configB.name} ({getUniqueToB().length})</h3>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {#each getUniqueToB() as file}
                      <Badge class="font-mono text-xs">{file}</Badge>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </Card>
        </AnimatedSection>

        <!-- Tags Comparison -->
        <AnimatedSection animEffect="fade-up" delay={200}>
          <h2 class="text-2xl font-bold mb-6">Tags Comparison</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 class="font-semibold mb-4 truncate">{configA.name}</h3>
              <div class="flex flex-wrap gap-2">
                {#each configA.tags as tag}
                  <Badge class={configB.tags.includes(tag) ? "border-primary/50" : ""}>{tag}</Badge>
                {/each}
              </div>
            </Card>
            <Card>
              <h3 class="font-semibold mb-4 truncate">{configB.name}</h3>
              <div class="flex flex-wrap gap-2">
                {#each configB.tags as tag}
                  <Badge class={configA.tags.includes(tag) ? "border-primary/50" : ""}>{tag}</Badge>
                {/each}
              </div>
            </Card>
          </div>
        </AnimatedSection>

        <!-- Actions -->
        <AnimatedSection animEffect="fade-up" delay={300}>
          <div class="flex gap-4 justify-center">
            <Button href="/config/{configA.id}" variant="outline">
              View {configA.name}
            </Button>
            <Button href="/config/{configB.id}" variant="outline">
              View {configB.name}
            </Button>
          </div>
        </AnimatedSection>
      </div>
    {:else if !loading}
      <!-- Empty State -->
      <AnimatedSection animEffect="fade-up">
        <div class="text-center py-16">
          <div class="text-6xl mb-4">⚖️</div>
          <h3 class="text-2xl font-semibold mb-2">Select two configs to compare</h3>
          <p class="text-muted-foreground">
            Choose configurations from the dropdowns above to see a detailed comparison
          </p>
        </div>
      </AnimatedSection>
    {/if}
  </Container>
</div>
