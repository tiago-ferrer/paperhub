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
