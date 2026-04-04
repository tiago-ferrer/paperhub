# Stores

Svelte stores for cross-component state. These are the only place where state lives outside of components.

## Stores

### `auth.ts`
- `authStore` — writable `{ token: string | null, username: string | null }`; persisted to `localStorage`; has `.clear()` method
- `isLoggedIn` — derived boolean
- `currentUser` — derived username string
- `currentEmail` — derived email string

### `ui.ts`
- `sidebarCollapsed` — writable boolean; persisted to `localStorage`
- `sidebarMobileOpen` — writable boolean
- `theme` — writable `'light' | 'dark'`; applies `data-theme` attribute on `<html>`; persisted to `localStorage`
- `toggleTheme()`, `toggleSidebar()` — helper functions

### `toast.ts`
- Custom store returned by `createToastStore()`
- Methods: `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`, `toast.warning(msg)`, `toast.dismiss(id)`
- Rendered by `$lib/components/ui/ToastStack.svelte` in the app layout

### List stores (all follow same pattern)
Each writable array store pairs with a refresh function that calls the API silently:

| Store | Refresh fn | Used by |
|---|---|---|
| `notebooks` | `refreshNotebooks()` | Sidebar sub-items |
| `kanbanBoards` | `refreshKanbanBoards()` | Sidebar sub-items |
| `ganttCharts` | `refreshGanttCharts()` | Sidebar sub-items |
| `projects` | `refreshProjects()` | Sidebar sub-items |
| `transcriptionGroups` | `refreshTranscriptionGroups()` | Sidebar dynamic sub-items |

The Sidebar component calls these refresh functions on mount to populate its dynamic sub-items.

## Pattern for List Stores

```typescript
export const widgetsStore = writable<Widget[]>([])

export async function refreshWidgets(): Promise<void> {
  try {
    const result = await widgetsApi.list()
    widgetsStore.set(result.items)
  } catch {
    // silent — sidebar just shows nothing if it fails
  }
}
```

## Rules

- Stores are only read/written by components and store modules themselves
- API calls inside stores use the singleton `*Api` (not the SSR-safe factory)
- Do not put derived data in stores — derive it locally in components with `$derived`
