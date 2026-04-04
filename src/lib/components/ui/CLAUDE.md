# UI Components

Atomic, general-purpose UI primitives. These are the lowest-level building blocks used everywhere.

## Components

### `Button.svelte`
General-purpose button. Props: `variant` (`primary` | `secondary` | `ghost` | `danger`), `size`, `loading`, `disabled`, `onclick`.

### `Badge.svelte`
Inline label/tag. Props: `variant` (`default` | `success` | `warning` | `error` | `info`), `label`.

### `Avatar.svelte`
User avatar circle showing initials or image. Props: `name`, `src?`, `size`.

### `StatusChip.svelte`
Colored status pill — used for transcription statuses (`PENDING`, `PROCESSING`, `DONE`, `FAILED`), soft-delete state, etc.

### `Spinner.svelte`
Loading spinner. Props: `size` (px), `class`.

### `Divider.svelte`
Horizontal rule with optional label. Props: `label?`.

### `MarkdownContent.svelte`
Renders HTML output from `renderMarkdown()`. Applies prose styles and KaTeX math. Takes `content: string` (raw Markdown).

### `ToastStack.svelte`
Renders the toast notification stack. Subscribes to `$lib/stores/toast`. Placed once in the app layout — do not add it to individual pages.
