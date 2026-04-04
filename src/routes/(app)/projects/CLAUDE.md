# Projects

Aggregation containers that group items of multiple types together.

## Routes

```
projects/
  +page.svelte            # Projects list
  +page.ts                # Loads projects
  [projectId]/
    +page.svelte          # Project detail: all items grouped by type
    +page.ts              # Loads project + all item types in parallel
```

## Data Model (`$lib/types/project.ts`)

**Project:** `id`, `name`, `description`, `items: ProjectItem[]`

**ProjectItem:** `id`, `type: ProjectItemType`, `referenceId?`, `notebookId?`, `kanbanBoardId?`, `ganttChartId?`, `transcriptionGroupId?`

**ProjectItemType** enum: `NOTEBOOK`, `PAPER`, `KANBAN_BOARD`, `GANTT_CHART`, `TRANSCRIPTION_GROUP`

## API (`$lib/api/projects.ts`)

- Standard CRUD: `list()`, `get(id)`, `create(payload)`, `patch(id, payload)`, `remove(id)`
- `addItems(id, items: ProjectItem[])` — add items to a project
- `removeItem(id, itemId)` — remove a single item from a project

## Detail Page

The `[projectId]/+page.ts` loads the project and all resources in parallel so the detail page can display items categorized by type:
- Papers (References)
- Notebooks
- Kanban Boards
- Gantt Charts
- Transcription Groups

Items link to their respective detail routes.

## Adding Items to Projects

`AddToProjectModal.svelte` (`$lib/components/projects/`) is a modal that can be opened from any resource's detail page to assign it to one or more projects.
