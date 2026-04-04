# PaperHub Frontend

SvelteKit 2 + Svelte 5 frontend for the PaperHub REST API — a research management tool for academics.

## Stack

- **SvelteKit 2** with **Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`)
- **TailwindCSS 4** (CSS-first: `@import 'tailwindcss'` + `@theme {}` blocks — no `tailwind.config.ts`)
- **lucide-svelte** 0.577.x for icons
- **TypeScript** strict mode
- `marked` + `katex` for Markdown and math rendering

## Svelte 5 Rules — Always Follow

- Use runes syntax only: **NO** `export let`, **NO** `$:` reactive labels, **NO** `<slot>`
- Props: `let { foo, bar } = $props()`
- State: `let x = $state(value)`
- Derived: `let y = $derived(expr)`
- Side effects: `$effect(() => { ... })`
- Slots → `{@render children()}` (import `type Snippet` from `'svelte'`)
- Dynamic icons: `<item.icon />` NOT `<svelte:component this={item.icon} />`

## CSS Rules

- CSS custom properties defined on `:root` and `[data-theme="dark"]` in `src/app.css`
- Design tokens: `--color-surface-0/1/2/3`, `--color-primary`, `--color-text-primary/secondary`, `--color-sidebar-*`, `--shadow-1/2/3`, `--topbar-height`, `--sidebar-width`, `--sidebar-collapsed-width`
- CSS globals in Svelte: use `.class :global(selector)` on **separate lines**, NOT comma-separated inside `:global()`
- Font: Google Sans (sans) + Roboto Mono (mono)

## Architecture

```
src/
  lib/
    api/          # All HTTP calls — no fetch in components
    components/   # Reusable Svelte components
    config/       # Navigation structure
    stores/       # Svelte stores for cross-cutting state
    types/        # TypeScript interfaces
    utils/        # Pure utility functions
  routes/
    (app)/        # Authenticated app — guarded by +layout.ts
    (auth)/       # Login, register, password reset
```

## Core Rules

- **No component calls fetch** — only `$lib/api/*` modules make HTTP requests
- Route data loading happens only in `+page.ts` / `+layout.ts` files
- Auth guard lives at `src/routes/(app)/+layout.ts`
- Navigation driven by `$lib/config/navigation.ts` `NAV_SECTIONS` array
- API base URL from `VITE_API_BASE_URL` env var (defaults to `''` for same-origin)

## Domain Features

| Feature | Route | API module | Types |
|---|---|---|---|
| References/Papers | `/references` | `references.ts` | `reference.ts` |
| Notebooks | `/notebooks` | `notebooks.ts` | `notebook.ts` |
| Projects | `/projects` | `projects.ts` | `project.ts` |
| Kanban boards | `/kanban` | `kanban.ts` | `kanban.ts` |
| Gantt charts | `/gantt` | `gantt.ts` | `gantt.ts` |
| Transcription | `/transcription` | `transcription.ts` | `transcription.ts` |
| MCP / API keys | `/mcp` | `apikeys.ts` | `apikey.ts` |

## Build

```bash
npm run dev       # dev server
npm run build     # production build
npm run check     # svelte-check (0 errors expected; ~45 pre-existing a11y warnings OK)
npm run preview   # preview production build
```
