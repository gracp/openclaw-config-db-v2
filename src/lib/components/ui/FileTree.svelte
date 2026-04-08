<script lang="ts">
  import { cn } from "$lib/utils/helpers";

  interface FileNode {
    name: string;
    type: "file" | "folder";
    children?: FileNode[];
    content?: string;
    fileType?: string;
  }

  interface Props {
    nodes: FileNode[];
    class?: string;
    onselect?: (file: { name: string; content: string }) => void;
    selectedFile?: string;
  }

  let {
    nodes,
    class: className = "",
    onselect,
    selectedFile,
  }: Props = $props();

  let expandedFolders = $state<Set<string>>(new Set());

  function toggleFolder(path: string) {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    expandedFolders = newSet;
  }

  function isFolderExpanded(path: string): boolean {
    return expandedFolders.has(path);
  }

  function getFileIcon(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const iconMap: Record<string, string> = {
      md: "📝",
      svelte: "✨",
      ts: "📘",
      js: "📒",
      json: "📋",
      css: "🎨",
      html: "🌐",
      svg: "🖼️",
      png: "🖼️",
      jpg: "🖼️",
      yml: "⚙️",
      yaml: "⚙️",
      sh: "🔧",
      zsh: "🔧",
      bash: "🔧",
    };
    return iconMap[ext] || "📄";
  }

  function handleFileClick(node: FileNode, parentPath: string = "") {
    if (node.type === "file" && node.content !== undefined) {
      onselect?.({ name: node.name, content: node.content });
    }
  }

  function renderNode(node: FileNode, parentPath: string = ""): string {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isDir = node.type === "folder";
    const expanded = isFolderExpanded(path);

    if (isDir) {
      const childrenHtml = expanded && node.children
        ? `<div class="ml-4 border-l border-border/50 pl-2">${node.children.map(c => renderNode(c, path)).join("")}</div>`
        : "";
      return `
        <div>
          <button
            onclick="toggleFolder('${path}')"
            class="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 transition-all duration-150 text-left group"
          >
            <span class="transition-transform duration-200 ${expanded ? "rotate-90" : ""}" style="width: 16px; display: inline-block;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </span>
            <span class="text-muted-foreground group-hover:text-foreground transition-colors">
              📁 ${node.name}
            </span>
            ${node.children ? `<span class="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">${node.children.length}</span>` : ""}
          </button>
          ${childrenHtml}
        </div>
      `;
    } else {
      const isSelected = selectedFile === node.name;
      return `
        <button
          onclick="handleFileClick('${node.name}', '${node.content?.replace(/'/g, "\\'") || ""}')
          class="w-full flex items-center gap-2 py-1.5 px-2 rounded transition-all duration-150 text-left group ${isSelected ? "bg-accent text-foreground" : "hover:bg-accent/50"}"
        >
          <span class="text-muted-foreground group-hover:text-foreground transition-colors w-4">
            ${getFileIcon(node.name)}
          </span>
          <span class="${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"} flex-1 truncate">
            ${node.name}
          </span>
          <span class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground">
            ${node.content ? `${Math.round(node.content.length / 1024 * 10) / 10}KB` : ""}
          </span>
        </button>
      `;
    }
  }
</script>

<!-- File Tree using recursive rendering via {#each} -->
<div class={cn("font-mono text-sm", className)}>
  {#each nodes as node}
    {@const path = node.name}
    {@const isDir = node.type === "folder"}
    {@const expanded = expandedFolders.has(path)}

    {#if isDir}
      <div>
        <button
          onclick={() => toggleFolder(path)}
          class="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 transition-all duration-150 text-left group"
        >
          <span class="transition-transform duration-200 {expanded ? 'rotate-90' : ''}" style="width: 16px; display: inline-block;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </span>
          <span class="text-muted-foreground group-hover:text-foreground transition-colors">
            📁 {node.name}
          </span>
          {#if node.children}
            <span class="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {node.children.length}
            </span>
          {/if}
        </button>

        {#if expanded && node.children}
          <div class="ml-4 border-l border-border/50 pl-2">
            {#each node.children as child}
              {@const childPath = `${path}/${child.name}`}
              {@const childIsDir = child.type === "folder"}
              {@const childExpanded = expandedFolders.has(childPath)}

              {#if childIsDir}
                <div>
                  <button
                    onclick={() => toggleFolder(childPath)}
                    class="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 transition-all duration-150 text-left group"
                  >
                    <span class="transition-transform duration-200 {childExpanded ? 'rotate-90' : ''}" style="width: 16px; display: inline-block;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </span>
                    <span class="text-muted-foreground group-hover:text-foreground transition-colors">
                      📁 {child.name}
                    </span>
                    {#if child.children}
                      <span class="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {child.children.length}
                      </span>
                    {/if}
                  </button>

                  {#if childExpanded && child.children}
                    <div class="ml-4 border-l border-border/50 pl-2">
                      {#each child.children as grandchild}
                        {@const grandchildPath = `${childPath}/${grandchild.name}`}
                        {@const grandchildIsDir = grandchild.type === "folder"}
                        {@const grandchildExpanded = expandedFolders.has(grandchildPath)}

                        {#if grandchildIsDir}
                          <div>
                            <button
                              onclick={() => toggleFolder(grandchildPath)}
                              class="w-full flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent/50 transition-all duration-150 text-left group"
                            >
                              <span class="transition-transform duration-200 {grandchildExpanded ? 'rotate-90' : ''}" style="width: 16px; display: inline-block;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M9 18l6-6-6-6"/>
                                </svg>
                              </span>
                              <span class="text-muted-foreground group-hover:text-foreground transition-colors">
                                📁 {grandchild.name}
                              </span>
                            </button>
                          </div>
                        {:else}
                          <button
                            onclick={() => grandchild.content && onselect?.({ name: grandchild.name, content: grandchild.content })}
                            class="w-full flex items-center gap-2 py-1.5 px-2 rounded transition-all duration-150 text-left group {selectedFile === grandchild.name ? 'bg-accent text-foreground' : 'hover:bg-accent/50'}"
                          >
                            <span class="text-muted-foreground group-hover:text-foreground transition-colors w-4">
                              {getFileIcon(grandchild.name)}
                            </span>
                            <span class="{selectedFile === grandchild.name ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'} flex-1 truncate">
                              {grandchild.name}
                            </span>
                          </button>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <button
                  onclick={() => child.content && onselect?.({ name: child.name, content: child.content })}
                  class="w-full flex items-center gap-2 py-1.5 px-2 rounded transition-all duration-150 text-left group {selectedFile === child.name ? 'bg-accent text-foreground' : 'hover:bg-accent/50'}"
                >
                  <span class="text-muted-foreground group-hover:text-foreground transition-colors w-4">
                    {getFileIcon(child.name)}
                  </span>
                  <span class="{selectedFile === child.name ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'} flex-1 truncate">
                    {child.name}
                  </span>
                  <span class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground">
                    {child.content ? `${Math.round(child.content.length / 1024 * 10) / 10}KB` : ""}
                  </span>
                </button>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <button
        onclick={() => node.content && onselect?.({ name: node.name, content: node.content })}
        class="w-full flex items-center gap-2 py-1.5 px-2 rounded transition-all duration-150 text-left group {selectedFile === node.name ? 'bg-accent text-foreground' : 'hover:bg-accent/50'}"
      >
        <span class="text-muted-foreground group-hover:text-foreground transition-colors w-4">
          {getFileIcon(node.name)}
        </span>
        <span class="{selectedFile === node.name ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'} flex-1 truncate">
          {node.name}
        </span>
        <span class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground">
          {node.content ? `${Math.round(node.content.length / 1024 * 10) / 10}KB` : ""}
        </span>
      </button>
    {/if}
  {/each}
</div>
