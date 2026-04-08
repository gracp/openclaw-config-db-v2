<script lang="ts">
  import Container from "./Container.svelte";
</script>

<footer class="border-t border-border mt-auto">
  <Container>
    <div class="py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-muted-foreground">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>OpenClaw ConfigDB</span>
      </div>

      <div class="flex items-center gap-6 text-sm text-muted-foreground">
        <a href="/browse" class="hover:text-foreground transition-colors">Browse</a>
        <a href="/upload" class="hover:text-foreground transition-colors">Upload</a>
        <a href="/compare" class="hover:text-foreground transition-colors">Compare</a>
      </div>

      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Built with</span>
        <a href="https://kit.svelte.dev" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">SvelteKit</a>
        <span>&</span>
        <a href="https://openclaw.dev" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">OpenClaw</a>
      </div>
    </div>
  </Container>
</footer>
