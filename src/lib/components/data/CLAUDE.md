# Data Components

Components for displaying lists and tabular data.

## Components

### `DataTable.svelte`
Generic table with sortable columns and optional row actions. Props: `columns`, `rows`, `onSort?`, `loading?`. Used for the References list view.

### `EmptyState.svelte`
Centered empty state illustration with a message and optional CTA button. Props: `title`, `description?`, `actionLabel?`, `onAction?`.

Use this whenever a list is empty rather than rendering nothing.

### `Pagination.svelte`
Page navigation controls. Props: `page: number`, `total: number`, `size: number`, `onPageChange: (page: number) => void`.

Displays `"Showing X–Y of Z"` and prev/next buttons. Works with the `PageResult<T>` response shape from the API.

## Pagination Pattern

```svelte
<script lang="ts">
  let page = $state(0)
  let total = $state(0)
  // reload data when page changes
  $effect(() => { loadData(page) })
</script>

<Pagination {page} {total} size={20} onPageChange={(p) => page = p} />
```
