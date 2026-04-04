# Gantt

Timeline/project chart tool for visualizing tasks over time.

## Routes

```
gantt/
  +page.svelte            # Charts list
  +page.ts                # Loads charts
  [chartId]/
    +page.svelte          # Chart detail with timeline visualization
    +page.ts              # Loads chart with all tasks
```

## Data Model (`$lib/types/gantt.ts`)

**GanttChart:** `id`, `name`, `description`, `tasks: GanttTask[]`

**GanttTask:** `id`, `title`, `startDate`, `endDate`, `progress: number` (0–100), `parentId?`, `assignee?`, `color?`

## API (`$lib/api/gantt.ts`)

- `listCharts()`, `getChart(id)`, `createChart(payload)`, `patchChart(id, payload)`, `deleteChart(id)`
- `createTask(chartId, payload)`, `patchTask(chartId, taskId, payload)`, `deleteTask(chartId, taskId)`
- Tasks can be nested via `parentId` for subtask grouping

## Chart Detail

The `[chartId]/+page.svelte` renders the Gantt chart visualization. Tasks appear as horizontal bars scaled to their date range within the chart's timeline.
