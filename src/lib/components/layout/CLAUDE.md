# Layout Components

App shell components rendered once in the `(app)` group layout.

## Components

### `Sidebar.svelte`
Left navigation sidebar.
- Reads `NAV_SECTIONS` from `$lib/config/navigation.ts` to render nav items
- Reads list stores (`kanbanBoards`, `notebooks`, `transcriptionGroups`, etc.) to render dynamic sub-items
- Calls `refresh*()` store functions on mount to populate dynamic sub-items
- Controlled by `sidebarCollapsed` and `sidebarMobileOpen` from `$lib/stores/ui`
- Uses `<item.icon />` pattern for lucide icons — NOT `<svelte:component this={item.icon} />`
- Active item highlighted by matching `$page.url.pathname`

### `TopBar.svelte`
Fixed top bar showing:
- Hamburger/toggle for mobile sidebar
- Current page title (from breadcrumb or page title)
- User avatar + dropdown (links to Settings, logout)
- Theme toggle button

### `Breadcrumb.svelte`
Breadcrumb trail displayed inside `TopBar` or at the top of page content.
Props: `items: { label: string, href?: string }[]`
Last item has no link (current page). Used on detail and nested pages.

### `NavLoadingOverlay.svelte`
Full-bleed loading veil shown over the content area (not the Sidebar/TopBar) while
a route `load` function is running. Rendered in `(app)/+layout.svelte` whenever the
SvelteKit `$navigating` store (`$app/stores`) is non-null. Covers only `.content-area`
(absolute inset, `z-index: 10`, below Sidebar's 40 and TopBar's 30) so the Sidebar and
TopBar stay interactive during navigation while the rest of the screen is blocked from
clicks and shows a `Spinner`.

## Layout Hierarchy

```
(app)/+layout.svelte
  <Sidebar />
  <TopBar />
  <div class="content-area">           ← position: relative
    <main>
      <slot />   ← {#render children()}
    </main>
    <NavLoadingOverlay />              ← shown while $navigating
  </div>
  <ToastStack />
```
