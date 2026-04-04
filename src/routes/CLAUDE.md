# Routes

SvelteKit file-based routing. All routes live here.

## Route Groups

```
routes/
  +layout.svelte        # Root layout: sets up <html>, <body>, global styles
  +layout.ts            # Root loader (no auth guard here)
  +page.svelte          # Public landing page
  +error.svelte         # Global error boundary

  (auth)/               # Unauthenticated pages — separate simple layout
    login/
    register/
    forgot-password/
    reset-password/

  (app)/                # Authenticated app — guarded layout
    dashboard/
    references/
    notebooks/
    projects/
    kanban/
    gantt/
    transcription/
    mcp/
    settings/

  privacy-terms/        # Static legal page
```

## File Conventions

| File | Purpose |
|---|---|
| `+page.ts` | Data loader (`export const load: PageLoad`) — runs before render |
| `+layout.ts` | Layout-level loader — shared data for all children |
| `+page.svelte` | Page component — receives `data` from loader via `$props()` |
| `+layout.svelte` | Layout wrapper — wraps all child pages in the group |

## Auth Guard

`src/routes/(app)/+layout.ts` checks `authStore` and redirects to `/login` if not authenticated. All app routes inherit this guard automatically.

## Data Loading Pattern

```typescript
// +page.ts
import { makeNotebooksApi } from '$lib/api/notebooks'
export const load: PageLoad = async ({ params, fetch }) => {
  const api = makeNotebooksApi(fetch)   // SSR-safe
  const notebook = await api.get(params.id)
  return { notebook }
}
```

```svelte
// +page.svelte
<script lang="ts">
  import type { PageData } from './$types'
  let { data }: { data: PageData } = $props()
</script>
```
