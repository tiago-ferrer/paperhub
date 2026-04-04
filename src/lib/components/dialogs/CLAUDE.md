# Dialog Components

Overlay components: modals, slide-overs, and confirmation dialogs.

## Components

### `Modal.svelte`
Base modal wrapper. Props: `open: boolean`, `onClose: () => void`, `title?`, `children` snippet.
Use for forms and content that needs focus trap + backdrop.

### `SlideOver.svelte`
Side panel that slides in from the right. Same props as Modal. Used for detail/edit views that should not navigate away (e.g. Kanban card detail, transcription note editor).

### `ConfirmDialog.svelte`
Simple yes/no confirmation. Props: `open`, `title`, `message`, `onConfirm`, `onCancel`.

### `DestructiveConfirmDialog.svelte`
Like `ConfirmDialog` but requires the user to type a confirmation phrase before the destructive action is enabled. Props: `open`, `title`, `message`, `confirmPhrase`, `onConfirm`, `onCancel`.
Used for all delete operations on notebooks and posts to avoid accidental deletion.

## Usage Pattern

```svelte
<script lang="ts">
  let deleteOpen = $state(false)
</script>

<DestructiveConfirmDialog
  open={deleteOpen}
  title="Delete notebook"
  message="This will permanently delete the notebook and all its posts."
  confirmPhrase="delete my notebook"
  onConfirm={async () => { await notebooksApi.remove(id); deleteOpen = false }}
  onCancel={() => deleteOpen = false}
/>
```
