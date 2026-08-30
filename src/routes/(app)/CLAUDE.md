# App Routes

All authenticated pages. Protected by the auth guard in `+layout.ts`.

## Layout (`+layout.svelte`)

Renders the full app shell:
- `<Sidebar />` — left navigation
- `<TopBar />` — top header
- `<ToastStack />` — global toast notifications
- `{@render children()}` — page content in the main area

## Auth Guard (`+layout.ts`)

Checks `authStore` for a valid token. If missing, redirects to `/login` using `throw redirect(302, '/login')`. This protects every route in this group automatically.

## Sections

| Route | What it does |
|---|---|
| `dashboard/` | Stats overview + quick actions |
| `references/` | Academic paper library (CRUD, PDF view, annotations, notes, sharing) |
| `notebooks/` | Markdown notebook posts + handwriting posts |
| `projects/` | Multi-type item aggregation containers |
| `kanban/` | Drag-and-drop task boards |
| `gantt/` | Timeline/project charts |
| `transcription/` | Audio recording groups + transcripts + notes |
| `mcp/` | Model Context Protocol usage stats + API key management |
| `settings/` | User profile settings |

## Common Patterns Across All Feature Routes

**List page** (`+page.svelte` / `+page.ts`):
- Loads paginated list from API in `+page.ts`
- Shows `EmptyState` when no items
- Has "New" button linking to `./new`
- Supports `includeDeleted` toggle where the API offers it

**Detail page** (`[id]/+page.svelte`):
- Loads single item + related data in `+page.ts`
- Breadcrumb: `Feature > Item Name`
- Edit/delete actions (delete uses `DestructiveConfirmDialog`)

**Create/Edit page** (`new/+page.svelte`, `[id]/edit/+page.svelte`):
- Form with `FormField` wrappers
- Submits via the API module singleton (not the SSR factory)
- On success: `goto('..')` to return to the list or detail page

## Soft Deletes

Many resources support soft delete. When `includeDeleted` is true, deleted items appear muted with strikethrough and a restore action.

## Falha parcial em loaders

**Rule: any `+page.ts`/`+layout.ts` load that runs 2+ independent API calls (via `Promise.all` or otherwise) must classify each call as critical or degradable — never let a degradable call throw.**

Plain `await Promise.all([...])` is all-or-nothing: if any promise rejects, the whole `load()` rejects, and SvelteKit renders the single global `src/routes/+error.svelte` in place of the *entire* page — even when only one section's data actually failed and everything else loaded fine.

- **Critical** — required to render the page shell at all (e.g. `project.get(id)`, `chart.get(id)`, `getTranscription(...)`). Keep this a plain `await` outside `Promise.all` (or first in it) so a 404 still throws via `error(404, ...)`.
- **Degradable** — feeds one section/widget; the rest of the page is still useful without it (e.g. the 5 item-type lists on a project detail page, a notes side panel, a folder tree). Wrap these in `settle()` (`$lib/utils/settle.ts`) inside the `Promise.all`, and return `{ items, error }` (or `{ data, error }`) instead of the raw value.

In the `.svelte`, branch on `data.<section>.error` and render `<SectionError label="..." onretry={...} />` (`$lib/components/data/SectionError.svelte`) in place of that section, instead of an empty state (which would misleadingly look like "there's nothing here" rather than "this failed to load"). Pick `onretry` based on whether the page re-syncs local state from `data` on navigation: `invalidateAll()` when there's an `$effect` mirroring `data` into local `$state` (or no local copy at all), `location.reload()` when the page seeds local `$state` once from `data` with no re-sync (e.g. an editable canvas/grid).

```ts
// +page.ts
const [project, ganttCharts] = await Promise.all([
  ... /* critical: awaited/thrown before this, or handled with try/catch for 404 */
  settle(ganttApi.listCharts()),
])
return {
  project,
  ganttCharts: { items: ganttCharts.data?.items ?? [], error: ganttCharts.error },
}
```

```svelte
<!-- +page.svelte -->
{#if data.ganttCharts.error}
  <SectionError label="Gantt charts" onretry={() => invalidateAll()} />
{:else}
  <!-- render data.ganttCharts.items -->
{/if}
```

Already applied to `projects/[projectId]`, `dashboard`, `gantt/[chartId]`, and `transcription/[groupId]/[transcriptionId]` — look at those for worked examples before writing a new multi-call loader.
