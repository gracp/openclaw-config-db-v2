<script lang="ts">
  import Container from "$lib/components/ui/Container.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Input from "$lib/components/ui/Input.svelte";
  import Badge from "$lib/components/ui/Badge.svelte";
  import Card from "$lib/components/ui/Card.svelte";
  import AnimatedSection from "$lib/components/ui/AnimatedSection.svelte";

  let dragActive = $state(false);
  let files = $state<Array<{ name: string; content: string }>>([]);
  let configName = $state("");
  let configDescription = $state("");
  let sourceUrl = $state("");
  let selectedTags = $state<string[]>([]);
  let isSubmitting = $state(false);
  let submitSuccess = $state(false);
  let error = $state("");

  let allTags = [
    "discord", "email", "calendar", "productivity", "automation",
    "social", "marketing", "development", "analytics", "crm",
    "assistant", "research", "creative", "technical", "business",
  ];

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragActive = false;

    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles) {
      await processFiles(droppedFiles);
    }
  }

  async function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      await processFiles(input.files);
    }
  }

  async function processFiles(fileList: FileList) {
    const newFiles: Array<{ name: string; content: string }> = [];

    for (const file of fileList) {
      const content = await file.text();
      newFiles.push({ name: file.name, content });
    }

    files = [...files, ...newFiles];
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else if (selectedTags.length < 5) {
      selectedTags = [...selectedTags, tag];
    }
  }

  async function handleSubmit() {
    if (!configName.trim()) {
      error = "Config name is required";
      return;
    }
    if (files.length === 0) {
      error = "At least one file is required";
      return;
    }

    error = "";
    isSubmitting = true;

    try {
      const formData = new FormData();
      formData.append("name", configName);
      if (configDescription) formData.append("description", configDescription);
      if (sourceUrl) formData.append("sourceUrl", sourceUrl);
      formData.append("sourceType", "upload");
      
      files.forEach((file, i) => {
        formData.append(`files[${i}]`, new File([file.content], file.name, { type: "text/plain" }));
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      submitSuccess = true;
    } catch (err: any) {
      error = err.message || "Upload failed. Please try again.";
    } finally {
      isSubmitting = false;
    }
  }

  function reset() {
    configName = "";
    configDescription = "";
    sourceUrl = "";
    selectedTags = [];
    files = [];
    submitSuccess = false;
    error = "";
  }
</script>

<svelte:head>
  <title>Upload Config — OpenClaw ConfigDB</title>
</svelte:head>

<div class="py-12">
  <Container>
    {#if submitSuccess}
      <!-- Success State -->
      <div class="max-w-xl mx-auto text-center py-16">
        <AnimatedSection animEffect="scale">
          <div class="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold mb-3">Config Uploaded!</h1>
          <p class="text-muted-foreground mb-8">
            Your configuration has been submitted and will be reviewed by the community.
          </p>
          <div class="flex gap-4 justify-center">
            <Button href="/browse">Browse Configs</Button>
            <Button variant="outline" onclick={reset}>Upload Another</Button>
          </div>
        </AnimatedSection>

        <!-- Confetti-like particles -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          {#each Array(20) as _, i}
            <div
              class="absolute w-3 h-3 rounded-full animate-in"
              style="
                left: {10 + Math.random() * 80}%;
                top: {-10 + Math.random() * 20}%;
                background: {['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'][i % 5]};
                animation-delay: {i * 0.1}s;
                animation-duration: {1 + Math.random()}s;
              "
            ></div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Upload Form -->
      <AnimatedSection animEffect="fade-up">
        <div class="max-w-2xl mx-auto">
          <div class="mb-10">
            <h1 class="text-4xl font-bold mb-3">Upload Your Config</h1>
            <p class="text-muted-foreground text-lg">
              Share your OpenClaw configuration with the community
            </p>
          </div>
        </div>
      </AnimatedSection>

      <div class="max-w-2xl mx-auto space-y-8">
        <!-- Drag & Drop Zone -->
        <AnimatedSection animEffect="fade-up" delay={100}>
          <div
            role="button"
            tabindex="0"
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
            onclick={() => document.getElementById("file-input")?.click()}
            onkeydown={(e) => e.key === "Enter" && document.getElementById("file-input")?.click()}
            class="relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 {dragActive
              ? 'border-primary bg-primary/5 pulse-border'
              : 'border-border hover:border-muted-foreground hover:bg-accent/30'}"
          >
            <input
              id="file-input"
              type="file"
              multiple
              onchange={handleFileInput}
              class="hidden"
              accept=".md,.json,.ts,.js,.svelte,.yml,.yaml,.sh,.bash"
            />

            <div class="text-5xl mb-4">{dragActive ? "📥" : "📁"}</div>
            <h3 class="text-lg font-semibold mb-2">
              {dragActive ? "Drop files here" : "Drag & drop files"}
            </h3>
            <p class="text-muted-foreground text-sm mb-4">
              or click to browse your files
            </p>
            <p class="text-xs text-muted-foreground">
              Supports: .md, .json, .ts, .js, .svelte, .yml, .sh
            </p>
          </div>
        </AnimatedSection>

        <!-- File List -->
        {#if files.length > 0}
          <AnimatedSection animEffect="fade-up">
            <Card>
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold">Uploaded Files ({files.length})</h3>
                <Button variant="ghost" size="sm" onclick={() => files = []}>
                  Clear all
                </Button>
              </div>
              <div class="space-y-2 max-h-60 overflow-auto">
                {#each files as file, i}
                  <div class="flex items-center justify-between p-3 bg-accent/30 rounded-lg group">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-lg flex-shrink-0">📄</span>
                      <span class="text-sm truncate">{file.name}</span>
                      <span class="text-xs text-muted-foreground flex-shrink-0">
                        {Math.round(file.content.length / 1024 * 10) / 10}KB
                      </span>
                    </div>
                    <button
                      aria-label="Remove file"
                      onclick={() => removeFile(i)}
                      class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                {/each}
              </div>
            </Card>
          </AnimatedSection>
        {/if}

        <!-- Form Fields -->
        <AnimatedSection animEffect="fade-up" delay={200}>
          <Card>
            <div class="space-y-6">
              <!-- Config Name -->
              <div>
                <label for="name" class="block text-sm font-medium mb-2">Config Name *</label>
                <Input
                  id="name"
                  bind:value={configName}
                  placeholder="e.g., Marketing Automation Agent"
                />
              </div>

              <!-- Description -->
              <div>
                <label for="description" class="block text-sm font-medium mb-2">Description</label>
                <textarea
                  id="description"
                  bind:value={configDescription}
                  placeholder="Describe what this config does and how it works..."
                  rows="3"
                  class="w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              <!-- Source URL -->
              <div>
                <label for="source" class="block text-sm font-medium mb-2">Source URL</label>
                <Input
                  id="source"
                  type="url"
                  bind:value={sourceUrl}
                  placeholder="https://github.com/username/repo (optional)"
                />
              </div>

              <!-- Tags -->
              <fieldset>
                <legend class="block text-sm font-medium mb-2">Tags (up to 5)</legend>
                <div class="flex flex-wrap gap-2">
                  {#each allTags as tag}
                    <button
                      type="button"
                      onclick={() => toggleTag(tag)}
                      disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}
                      class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-30 {selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground'}"
                    >
                      {tag}
                    </button>
                  {/each}
                </div>
              </fieldset>
            </div>
          </Card>
        </AnimatedSection>

        <!-- Error -->
        {#if error}
          <AnimatedSection animEffect="fade-up">
            <div class="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          </AnimatedSection>
        {/if}

        <!-- Submit -->
        <AnimatedSection animEffect="fade-up" delay={300}>
          <div class="flex gap-4">
            <Button
              size="lg"
              class="flex-1"
              disabled={isSubmitting}
              onclick={handleSubmit}
            >
              {#if isSubmitting}
                <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"/>
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" class="opacity-75"/>
                </svg>
                Uploading...
              {:else}
                Upload Configuration
              {/if}
            </Button>
            <Button variant="outline" size="lg" href="/browse">
              Cancel
            </Button>
          </div>
        </AnimatedSection>
      </div>
    {/if}
  </Container>
</div>
