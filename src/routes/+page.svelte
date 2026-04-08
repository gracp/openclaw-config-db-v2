<script lang="ts">
  import Container from "$lib/components/ui/Container.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import AnimatedSection from "$lib/components/ui/AnimatedSection.svelte";
  import StatsGrid from "$lib/components/ui/StatsGrid.svelte";
  import ConfigCard from "$lib/components/ui/ConfigCard.svelte";

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

  let featuredConfigs: Config[] = $state([]);
  let loading = $state(true);

  const stats = [
    { label: "Configs", value: 14, icon: "📦" },
    { label: "Files", value: 96, icon: "📄" },
    { label: "Tags", value: 9, icon: "🏷️" },
    { label: "Sources", value: 11, icon: "🌐" },
  ];

  const steps = [
    {
      number: "01",
      title: "Browse",
      description: "Explore curated OpenClaw configurations from the community. Filter by use case, complexity, or platform.",
      icon: "🔍",
    },
    {
      number: "02",
      title: "Customize",
      description: "View detailed breakdowns of each agent's skills, tools, and architecture. Copy individual files or settings.",
      icon: "⚙️",
    },
    {
      number: "03",
      title: "Deploy",
      description: "Download the full configuration or integrate specific components into your own OpenClaw setup.",
      icon: "🚀",
    },
  ];

  $effect(() => {
    loadFeatured();
  });

  async function loadFeatured() {
    try {
      const res = await fetch("/api/configs?limit=6");
      const data = await res.json();
      if (data.configs) {
        featuredConfigs = data.configs.slice(0, 6).map((c: any) => ({
          ...c,
          fileCount: c.files?.length || 0,
        }));
      }
    } catch (err) {
      console.error("Failed to load featured configs:", err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>OpenClaw ConfigDB — Discover Agent Configurations</title>
</svelte:head>

<!-- Hero Section -->
<section class="relative min-h-[80vh] flex items-center overflow-hidden gradient-mesh">
  <Container class="relative z-10 py-20">
    <div class="max-w-4xl mx-auto text-center">
      <AnimatedSection animEffect="fade-up">
        <Badge class="mb-6 text-sm px-4 py-1.5">OpenClaw Registry</Badge>
      </AnimatedSection>

      <AnimatedSection delay={100} animEffect="fade-up">
        <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span class="gradient-text">OpenClaw ConfigDB</span>
        </h1>
      </AnimatedSection>

      <AnimatedSection delay={200} animEffect="fade-up">
        <p class="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Discover, share, and download community-powered OpenClaw agent configurations. Find the perfect setup for your workflow.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={300} animEffect="fade-up">
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/browse" size="lg" class="min-w-[180px]">
            Browse Configs
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Button>
          <Button href="/upload" variant="outline" size="lg" class="min-w-[180px]">
            Upload Yours
          </Button>
        </div>
      </AnimatedSection>

      <!-- Floating particles decoration -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        {#each Array(6) as _, i}
          <div
            class="absolute w-2 h-2 rounded-full bg-primary/20 animate-pulse"
            style="left: {15 + i * 15}%; top: {20 + (i % 3) * 25}%; animation-delay: {i * 0.5}s;"
          ></div>
        {/each}
      </div>
    </div>
  </Container>

  <!-- Gradient fade to background -->
  <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
</section>

<!-- Stats Bar -->
<section class="py-12 border-y border-border bg-card/30">
  <Container>
    <AnimatedSection animEffect="fade-up">
      <StatsGrid {stats} columns={4} />
    </AnimatedSection>
  </Container>
</section>

<!-- Featured Configs -->
<section class="py-20">
  <Container>
    <AnimatedSection animEffect="fade-up">
      <div class="flex items-end justify-between mb-10">
        <div>
          <h2 class="text-3xl md:text-4xl font-bold mb-2">Featured Configs</h2>
          <p class="text-muted-foreground">Hand-picked configurations from top contributors</p>
        </div>
        <Button href="/browse" variant="ghost">
          View all
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Button>
      </div>
    </AnimatedSection>

    {#if loading}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each Array(6) as _, i}
          <div class="bg-card border border-border rounded-xl p-6 animate-pulse">
            <div class="h-4 w-20 bg-muted rounded mb-4"></div>
            <div class="h-6 w-3/4 bg-muted rounded mb-2"></div>
            <div class="h-4 w-full bg-muted rounded mb-4"></div>
            <div class="flex gap-2 mb-4">
              <div class="h-5 w-16 bg-muted rounded-full"></div>
              <div class="h-5 w-16 bg-muted rounded-full"></div>
            </div>
            <div class="h-8 w-full bg-muted rounded"></div>
          </div>
        {/each}
      </div>
    {:else if featuredConfigs.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each featuredConfigs as config, i}
          <ConfigCard {config} index={i} />
        {/each}
      </div>
    {:else}
      <div class="text-center py-16">
        <div class="text-5xl mb-4">📦</div>
        <h3 class="text-xl font-semibold mb-2">No configs yet</h3>
        <p class="text-muted-foreground mb-6">Be the first to share your OpenClaw configuration!</p>
        <Button href="/upload">Upload a Config</Button>
      </div>
    {/if}
  </Container>
</section>

<!-- How It Works -->
<section class="py-20 border-t border-border">
  <Container>
    <AnimatedSection animEffect="fade-up">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
        <p class="text-muted-foreground text-lg">Three simple steps to find your perfect agent configuration</p>
      </div>
    </AnimatedSection>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each steps as step, i}
        <AnimatedSection animEffect="fade-up" delay={i * 150}>
          <Card class="relative h-full text-center group hover:border-primary/50 transition-all duration-300">
            <!-- Step number -->
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
              {step.number}
            </div>

            <div class="pt-8">
              <div class="text-5xl mb-4">{step.icon}</div>
              <h3 class="text-xl font-semibold mb-3">{step.title}</h3>
              <p class="text-muted-foreground">{step.description}</p>
            </div>

            <!-- Connector arrow (not on last) -->
            {#if i < steps.length - 1}
              <div class="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-muted-foreground/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            {/if}
          </Card>
        </AnimatedSection>
      {/each}
    </div>
  </Container>
</section>

<!-- CTA Section -->
<section class="py-24 border-t border-border relative overflow-hidden">
  <div class="absolute inset-0 gradient-mesh opacity-50"></div>
  <Container class="relative z-10">
    <AnimatedSection animEffect="scale">
      <div class="text-center max-w-2xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to streamline your OpenClaw setup?</h2>
        <p class="text-muted-foreground text-lg mb-8">
          Browse hundreds of community configurations or share your own expertise with the world.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/browse" size="lg">
            Start Browsing
          </Button>
          <Button href="/compare" variant="outline" size="lg">
            Compare Configs
          </Button>
        </div>
      </div>
    </AnimatedSection>
  </Container>
</section>
