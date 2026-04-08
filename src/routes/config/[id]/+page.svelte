<script lang="ts">
  import { onMount } from "svelte";
  import { Star } from "lucide-svelte";
  import Container from "$lib/components/ui/Container.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import AnimatedSection from "$lib/components/ui/AnimatedSection.svelte";
  import StatsGrid from "$lib/components/ui/StatsGrid.svelte";
  import FileTree from "$lib/components/ui/FileTree.svelte";
  import FileViewer from "$lib/components/ui/FileViewer.svelte";
  import SkillCard from "$lib/components/ui/SkillCard.svelte";

  let { data } = $props();

  let selectedFile = $state<{ name: string; content: string } | null>(null);
  let showFileViewer = $state(false);
  let activeSection = $state(0);
  let sections: HTMLElement[] = [];

  const config = $derived(data.config);
  
  // Rating state - use local copy for reactive updates
  let displayConfig = $state({ ...data.config });
  let userRating = $state<number | null>(null);
  let isSubmitting = $state(false);
  const skills = $derived(data.skills);
  const fileTree = $derived(data.fileTree);
  const agentIdentity = $derived(data.agentIdentity);
  const totalSize = $derived(data.totalSize);
  const complexity = $derived(data.complexity);

  const sourceTypeLabels = {
    github: "GitHub",
    upload: "Upload",
    community: "Community",
  };

  const complexityLabels = {
    simple: { label: "Simple", color: "success" as const },
    moderate: { label: "Moderate", color: "warning" as const },
    complex: { label: "Complex", color: "destructive" as const },
  };

  const navSections = [
    { id: "hero", label: "Overview" },
    { id: "agent", label: "Agent" },
    { id: "stats", label: "Stats" },
    { id: "files", label: "Files" },
    { id: "skills", label: "Skills" },
    { id: "setup", label: "Setup" },
  ];

  const configStats = $derived([
    { label: "Files", value: config.files.length, icon: "📄" },
    { label: "Size", value: Math.round(totalSize / 1024), suffix: " KB", icon: "💾" },
    { label: "Skills", value: skills.length, icon: "⚡" },
    { label: "Complexity", value: 0, suffix: complexityLabels[complexity].label, icon: "📊" },
  ]);

  onMount(() => {
    // Load user rating from localStorage
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`rating-${data.config.id}`);
      userRating = saved ? parseInt(saved, 10) || null : null;
    }
    
    sections = navSections.map((s) => document.getElementById(s.id)!);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sections.indexOf(entry.target as HTMLElement);
            if (index !== -1) activeSection = index;
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((s) => s && observer.observe(s));

    return () => observer.disconnect();
  });

  function handleFileSelect(file: { name: string; content: string }) {
    selectedFile = file;
    showFileViewer = true;
  }

  function closeFileViewer() {
    showFileViewer = false;
    selectedFile = null;
  }

  function scrollToSection(index: number) {
    const section = document.getElementById(navSections[index].id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  
  async function submitRating(rating: number) {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      const res = await fetch(`/api/configs/${data.config.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      if (res.ok) {
        userRating = rating;
        localStorage.setItem(`rating-${data.config.id}`, rating.toString());
        const result = await res.json();
        displayConfig.ratingAvg = result.ratingAvg;
        displayConfig.ratingCount = result.ratingCount;
      }
    } catch (e) {
      console.error('Failed to submit rating', e);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>{config.name} — OpenClaw ConfigDB</title>
  <meta name="description" content={config.description || `OpenClaw configuration: ${config.name}`} />
</svelte:head>

<!-- Floating Side Nav (Desktop) -->
<div class="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40">
  <nav class="flex flex-col gap-3">
    {#each navSections as section, i}
      <button
        onclick={() => scrollToSection(i)}
        class="group flex items-center gap-2"
        aria-label={section.label}
      >
        <div
          class="w-3 h-3 rounded-full transition-all duration-300 {activeSection === i
            ? 'bg-primary scale-125'
            : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/60'}"
        ></div>
        <span
          class="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0 whitespace-nowrap"
        >
          {section.label}
        </span>
      </button>
    {/each}
  </nav>
</div>

<!-- File Viewer Slide-over -->
{#if showFileViewer && selectedFile}
  <div class="fixed inset-0 z-50 flex justify-end">
    <button
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onclick={closeFileViewer}
      aria-label="Close file viewer"
    ></button>
    <div class="relative w-full max-w-3xl bg-background overflow-auto animate-in slide-in-from-right duration-300">
      <FileViewer
        filename={selectedFile.name}
        content={selectedFile.content}
        onclose={closeFileViewer}
        class="m-4 h-[calc(100%-2rem)]"
      />
    </div>
  </div>
{/if}

<div class="relative">
  <!-- Hero Section -->
  <section id="hero" class="relative py-20 overflow-hidden gradient-mesh">
    <Container>
      <AnimatedSection animEffect="fade-up">
        <div class="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <Badge variant="outline">{sourceTypeLabels[config.sourceType]}</Badge>
            {#if config.isFeatured}
              <Badge variant="success">Featured</Badge>
            {/if}
          </div>
          {#if config.author}
            <div class="text-sm text-muted-foreground">
              by {config.authorUrl ? `<a href="${config.authorUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${config.author}</a>` : config.author}
            </div>
          {/if}
        </div>

        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          {config.name}
        </h1>

        {#if config.description}
          <p class="text-xl text-muted-foreground max-w-3xl mb-8">{config.description}</p>
        {/if}

        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-primary">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span class="font-semibold">{config.stars.toLocaleString()}</span>
            <span class="text-muted-foreground">stars</span>
          </div>
          <div class="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted-foreground">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span class="font-semibold">{config.downloads.toLocaleString()}</span>
            <span class="text-muted-foreground">downloads</span>
          </div>
          {#if displayConfig.ratingCount > 0}
            <div class="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-yellow-400">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span class="font-semibold">{displayConfig.ratingAvg.toFixed(1)}</span>
              <span class="text-muted-foreground">({displayConfig.ratingCount} ratings)</span>
            </div>
          {/if}
          {#if config.sourceUrl}
            <a
              href={config.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-primary hover:underline"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View Source
            </a>
          {/if}
        </div>
      </AnimatedSection>
    </Container>
  </section>

  <!-- Meet the Agent Section -->
  <section id="agent" class="py-16 border-t border-border">
    <Container>
      <AnimatedSection animEffect="fade-up">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-lg">
            🤖
          </div>
          <h2 class="text-2xl md:text-3xl font-bold">Meet the Agent</h2>
        </div>
      </AnimatedSection>

      <AnimatedSection animEffect="fade-up" delay={100}>
        <Card class="max-w-3xl">
          <div class="flex flex-col md:flex-row gap-6">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-4xl shadow-lg">
                {agentIdentity.name ? agentIdentity.name[0].toUpperCase() : "🤖"}
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1">
              {#if agentIdentity.name}
                <h3 class="text-xl font-semibold mb-1">{agentIdentity.name}</h3>
              {/if}
              <p class="text-muted-foreground mb-3">
                {agentIdentity.vibe || "Assistant"} personality
              </p>

              {#if agentIdentity.personality && agentIdentity.personality.length > 0}
                <div class="flex flex-wrap gap-2 mb-4">
                  {#each agentIdentity.personality as trait}
                    <Badge>{trait}</Badge>
                  {/each}
                </div>
              {/if}

              {#if agentIdentity.channels && agentIdentity.channels.length > 0}
                <div class="flex flex-wrap gap-2">
                  <span class="text-sm text-muted-foreground">Channels:</span>
                  {#each agentIdentity.channels as channel}
                    <Badge variant="outline">{channel}</Badge>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </Card>
      </AnimatedSection>
    </Container>
  </section>

  <!-- Quick Stats Section -->
  <section id="stats" class="py-16 border-t border-border bg-card/20">
    <Container>
      <AnimatedSection animEffect="fade-up">
        <h2 class="text-2xl md:text-3xl font-bold mb-8">Quick Stats</h2>
      </AnimatedSection>
      <AnimatedSection animEffect="fade-up" delay={100}>
        <StatsGrid stats={configStats} columns={4} />
      </AnimatedSection>

      {#if config.tags.length > 0}
        <AnimatedSection animEffect="fade-up" delay={200} class="mt-8">
          <div class="flex flex-wrap gap-2">
            {#each config.tags as tag}
              <a href="/browse?tag={encodeURIComponent(tag)}" class="inline-block">
                <Badge class="cursor-pointer hover:bg-accent transition-colors">{tag}</Badge>
              </a>
            {/each}
          </div>
        </AnimatedSection>
      {/if}
    </Container>
  </section>

  <!-- What's Inside Section -->
  <section id="files" class="py-16 border-t border-border">
    <Container>
      <AnimatedSection animEffect="fade-up">
        <h2 class="text-2xl md:text-3xl font-bold mb-8">What's Inside</h2>
      </AnimatedSection>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- File Tree -->
        <AnimatedSection animEffect="fade-up" delay={100}>
          <Card class="h-full">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-lg">File Structure</h3>
              <Badge variant="outline">{config.files.length} files</Badge>
            </div>
            <div class="overflow-auto max-h-[400px]">
              <FileTree
                nodes={fileTree}
                onselect={handleFileSelect}
                selectedFile={selectedFile?.name}
              />
            </div>
          </Card>
        </AnimatedSection>

        <!-- Architecture section removed - file tree above shows structure -->

      </div>
    </Container>
  </section>

  <!-- Skills & Tools Section -->
  <section id="skills" class="py-16 border-t border-border bg-card/20">
    <Container>
      <AnimatedSection animEffect="fade-up">
        <h2 class="text-2xl md:text-3xl font-bold mb-8">Skills & Tools</h2>
      </AnimatedSection>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each skills as skill, i}
          <AnimatedSection animEffect="fade-up" delay={i * 50}>
            <SkillCard {skill} />
          </AnimatedSection>
        {/each}
      </div>
    </Container>
  </section>

  <!-- Setup Section -->
  <section id="setup" class="py-16 border-t border-border">
    <Container>
      <AnimatedSection animEffect="fade-up">
        <h2 class="text-2xl md:text-3xl font-bold mb-8">Get Started</h2>
      </AnimatedSection>

      <div class="max-w-3xl">
        <AnimatedSection animEffect="fade-up" delay={100}>
          <Card class="mb-8">
            <h3 class="font-semibold text-lg mb-4">Setup Steps</h3>
            <div class="space-y-4">
              {#each [
                { step: 1, title: "Download the config", desc: "Download all files or clone the repository" },
                { step: 2, title: "Place in your workspace", desc: "Copy the files to your OpenClaw workspace directory" },
                { step: 3, title: "Customize as needed", desc: "Edit configuration files to match your setup" },
                { step: 4, title: "Restart OpenClaw", desc: "Reload your agent to pick up the new configuration" },
              ] as item}
                <div class="flex gap-4 items-start group">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center font-semibold text-sm group-hover:scale-110 transition-transform">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-medium">{item.title}</div>
                    <div class="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              {/each}
            </div>
          </Card>
        </AnimatedSection>

        <!-- Interactive Rating Widget -->
        <AnimatedSection animEffect="fade-up" delay={150}>
          <Card class="mt-6">
            <div class="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <p class="text-sm text-muted-foreground mb-2">Rate this config:</p>
                <div class="flex items-center gap-1" id="rating-widget">
                  {#each [1, 2, 3, 4, 5] as star}
                    <button
                      onclick={() => submitRating(star)}
                      class="p-1 hover:scale-110 transition-transform disabled:opacity-50"
                      aria-label="Rate {star} stars"
                      disabled={isSubmitting}
                    >
                      <Star
                        class="w-6 h-6 transition-colors {userRating !== null && userRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted hover:text-yellow-300'}"
                      />
                    </button>
                  {/each}
                  {#if userRating}
                    <span class="text-sm text-muted-foreground ml-2">You rated: {userRating}★</span>
                  {/if}
                </div>
              </div>
            </div>
          </Card>
        </AnimatedSection>
        
        <AnimatedSection animEffect="fade-up" delay={200}>
          <div class="flex flex-col sm:flex-row gap-4">
            <Button href="/api/configs/{config.id}/download" size="lg" class="flex-1 sm:flex-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Full Config
            </Button>
            <Button href="/compare?a={config.id}" variant="outline" size="lg" class="flex-1 sm:flex-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Compare
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </Container>
  </section>

  <!-- Footer Meta -->
  <section class="py-8 border-t border-border bg-card/20">
    <Container>
      <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>
          Created {formatDate(config.createdAt)} • Updated {formatDate(config.updatedAt)}
        </div>
        <div>
          <a href="/browse" class="text-primary hover:underline">← Back to Browse</a>
        </div>
      </div>
    </Container>
  </section>
</div>
