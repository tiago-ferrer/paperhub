# Components

Reusable Svelte 5 components. All use runes syntax (`$props`, `$state`, `$derived`, `$effect`).

## Directory Structure

```
components/
  data/       # Tables, empty states, pagination
  dialogs/    # Modals, slide-overs, confirm dialogs
  forms/      # Form inputs and field wrappers
  layout/     # Sidebar, TopBar, Breadcrumb
  marketing/  # Landing page sections
  projects/   # Project-specific modals
  references/ # Reference-specific modals
  ui/         # Atomic UI primitives
```

## Rules

- Components never call `fetch` directly — mutations go through `$lib/api/*`
- Props declared as `let { foo, bar, onAction } = $props()`
- Event callbacks use prop functions (e.g. `onConfirm`, `onClose`) — no `createEventDispatcher`
- Slots replaced with `{@render children()}` and `Snippet` type from `'svelte'`
- Icons: `<SomeIcon class="..." size={16} />` from `lucide-svelte`

## Snippet / Children Pattern

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'
  let { children }: { children?: Snippet } = $props()
</script>

{#if children}
  {@render children()}
{/if}
```

## CSS Conventions

- Use TailwindCSS utility classes
- Component-scoped styles use `<style>` with `:global()` when targeting child elements
- Design tokens (`--color-*`, `--shadow-*`) available everywhere via CSS custom properties
