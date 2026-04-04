# Config

Static configuration objects for the app.

## `navigation.ts`

Defines the sidebar navigation structure. The `Sidebar` component reads `NAV_SECTIONS` to render all nav items.

```typescript
interface NavItem {
  label: string
  href: string
  icon: any           // lucide-svelte component
  badge?: string
  ownerOnly?: boolean // hides item for non-owners
  submenu?: NavItem[] // enables collapsible sub-nav
}

interface NavSection {
  title?: string      // section header (e.g. "Library", "System")
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[]
```

### Current sections

**Ungrouped:** Dashboard, Kanban, Gantt, Projects

**Library:** References, Notebooks, Transcription

**System:** Settings, MCP (with submenu: Usage, API Keys)

## Adding a new top-level route

1. Add the route under `src/routes/(app)/your-feature/`
2. Add an entry in `NAV_SECTIONS` in `navigation.ts` with label, href, and a `lucide-svelte` icon
3. If the feature needs sidebar sub-items (like Transcription groups), create a store in `$lib/stores/` and call the refresh function in `Sidebar.svelte` on mount
