<script lang="ts">
  import { cn } from "$lib/utils/helpers";

  interface Props {
    filename: string;
    content: string;
    class?: string;
    onclose?: () => void;
  }

  let {
    filename,
    content,
    class: className = "",
    onclose,
  }: Props = $props();

  let copied = $state(false);

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(content);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  function getLanguage(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const langMap: Record<string, string> = {
      md: "markdown",
      svelte: "html",
      ts: "typescript",
      js: "javascript",
      jsx: "jsx",
      tsx: "tsx",
      json: "json",
      css: "css",
      html: "html",
      svg: "xml",
      yml: "yaml",
      yaml: "yaml",
      sh: "bash",
      zsh: "bash",
      bash: "bash",
      sql: "sql",
    };
    return langMap[ext] || "text";
  }

  // Simple syntax highlighting using regex replacements
  function highlight(code: string, lang: string): string {
    // Escape HTML
    let html = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Apply basic highlighting patterns
    if (lang === "markdown") {
      html = html
        .replace(/^(#{1,6})\s+(.*)$/gm, '<span class="text-primary font-semibold">$1 $2</span>')
        .replace(/\*\*(.*?)\*\*/g, '<span class="text-warning">**$1**</span>')
        .replace(/\*(.*?)\*/g, '<span class="text-success">*$1*</span>')
        .replace(/`(.*?)`/g, '<span class="bg-accent px-1 rounded text-sm">`$1`</span>');
    } else if (lang === "javascript" || lang === "typescript" || lang === "jsx" || lang === "tsx") {
      html = html
        .replace(/(\/\/.*$)/gm, '<span class="text-muted-foreground">$1</span>')
        .replace(/\b(const|let|var|function|return|import|export|from|default|async|await|if|else|for|while|class|extends|new|this|interface|type|enum)\b/g,
          '<span class="text-primary">$1</span>')
        .replace(/('.*?'|".*?"|`.*?`)/g, '<span class="text-warning">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-success">$1</span>');
    } else if (lang === "json" || lang === "yaml") {
      html = html
        .replace(/("(?:[^"\\]|\\.)*"\s*:)/g, '<span class="text-primary">$1</span>')
        .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="text-warning">$1</span>')
        .replace(/:\s*(\d+)/g, ': <span class="text-success">$1</span>')
        .replace(/(\/\/.*$)/gm, '<span class="text-muted-foreground">$1</span>');
    } else if (lang === "css") {
      html = html
        .replace(/(\/\*.*?\*\/)/gs, '<span class="text-muted-foreground">$1</span>')
        .replace(/([.#]?[a-zA-Z-]+)\s*\{/g, '<span class="text-primary">$1</span> {')
        .replace(/([a-zA-Z-]+)\s*:/g, '<span class="text-success">$1</span>:');
    }

    return html;
  }

  const language = $derived(getLanguage(filename));
  const highlighted = $derived(highlight(content, language));
  const lineCount = $derived(content.split("\n").length);
</script>

<div class={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/30">
    <div class="flex items-center gap-3">
      <div class="flex gap-1.5">
        <div class="w-3 h-3 rounded-full bg-destructive/60"></div>
        <div class="w-3 h-3 rounded-full bg-warning/60"></div>
        <div class="w-3 h-3 rounded-full bg-success/60"></div>
      </div>
      <span class="text-sm font-medium text-foreground">{filename}</span>
      <span class="text-xs text-muted-foreground">{language}</span>
    </div>

    <div class="flex items-center gap-2">
      <span class="text-xs text-muted-foreground">{lineCount} lines</span>
      <button
        onclick={copyContent}
        class="p-1.5 rounded hover:bg-accent transition-all duration-200 text-muted-foreground hover:text-foreground"
        aria-label="Copy content"
      >
        {#if copied}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-success">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        {/if}
      </button>
      {#if onclose}
        <button
          onclick={onclose}
          class="p-1.5 rounded hover:bg-accent transition-all duration-200 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Content -->
  <div class="overflow-auto max-h-[60vh]">
    <pre class="p-4 text-sm leading-relaxed overflow-x-auto text-foreground"><code class="text-foreground">{@html highlighted}</code></pre>
  </div>
</div>
