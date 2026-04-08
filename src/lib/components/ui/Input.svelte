<script lang="ts">
  import { cn } from "$lib/utils/helpers";

  interface Props {
    class?: string;
    type?: "text" | "email" | "password" | "url" | "search";
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    readonly?: boolean;
    name?: string;
    id?: string;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
    onkeydown?: (e: KeyboardEvent) => void;
  }

  let {
    class: className = "",
    type = "text",
    placeholder = "",
    value = $bindable(""),
    disabled = false,
    readonly = false,
    name,
    id,
    oninput,
    onchange,
    onkeydown,
  }: Props = $props();
</script>

<input
  {type}
  {placeholder}
  {disabled}
  {readonly}
  {name}
  {id}
  bind:value
  {oninput}
  {onchange}
  {onkeydown}
  class={cn(
    "w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
    "hover:border-muted-foreground/50",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    className
  )}
/>
