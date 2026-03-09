<script lang="ts">
  import { goto } from '$app/navigation'
  import { kanbanApi } from '$lib/api/kanban'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { KanbanColumnPayload } from '$lib/types/kanban'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import { Plus, Trash2 } from 'lucide-svelte'

  let title       = $state('')
  let description = $state('')
  let saving      = $state(false)
  let errors      = $state<Record<string, string>>({})

  const DEFAULT_COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9334ea', '#00bcd4']

  let columns = $state<KanbanColumnPayload[]>([
    { name: 'To Do',       position: 0, color: '#9aa0a6' },
    { name: 'In Progress', position: 1, color: '#1a73e8' },
    { name: 'Done',        position: 2, color: '#34a853' },
  ])

  function addColumn() {
    columns.push({ name: '', position: columns.length, color: DEFAULT_COLORS[columns.length % DEFAULT_COLORS.length] })
  }

  function removeColumn(i: number) {
    columns.splice(i, 1)
    columns.forEach((c, idx) => { c.position = idx })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    errors = validate()
    if (Object.keys(errors).length) return

    saving = true
    try {
      const cols = columns.filter(c => c.name.trim()).map((c, i) => ({ ...c, name: c.name.trim(), position: i }))
      const board = await kanbanApi.createBoard({
        title: title.trim(),
        description: description.trim() || undefined,
        columns: cols.length ? cols : undefined,
      })
      toast.success('Board created')
      goto(`/kanban/${board.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create board')
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/kanban" class="back-link">← Kanban Boards</a>
    <h1>New Board</h1>
  </div>

  <form onsubmit={submit} class="form">
    <div class="form-grid">
      <FormField label="Title" required error={errors.title}>
        <input type="text" bind:value={title} placeholder="My Project Board" />
      </FormField>
      <FormField label="Description">
        <textarea bind:value={description} rows={2} placeholder="A brief description…"></textarea>
      </FormField>
    </div>

    <div class="columns-section">
      <div class="columns-header">
        <span class="columns-label">Initial Columns</span>
        <button type="button" class="add-col-btn" onclick={addColumn}>
          <Plus size={14} /> Add column
        </button>
      </div>
      <div class="columns-list">
        {#each columns as col, i}
          <div class="col-row">
            <input
              class="col-color"
              type="color"
              bind:value={col.color}
              title="Column colour"
            />
            <input
              class="col-name"
              type="text"
              bind:value={col.name}
              placeholder="Column name"
            />
            <button type="button" class="icon-btn danger" onclick={() => removeColumn(i)} title="Remove">
              <Trash2 size={15} />
            </button>
          </div>
        {/each}
      </div>
    </div>

    <div class="form-actions">
      <Button variant="outlined" onclick={() => goto('/kanban')}>Cancel</Button>
      <Button type="submit" loading={saving}>Create Board</Button>
    </div>
  </form>
</div>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 400; }

  .form { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 28px; }
  .form-grid { display: flex; flex-direction: column; gap: 18px; }
  .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-surface-3); }

  :global(.form textarea) {
    width: 100%; padding: 8px 12px; border-radius: 6px; resize: vertical;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
    box-sizing: border-box;
  }
  :global(.form textarea:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .columns-section { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--color-surface-2); }
  .columns-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .columns-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
  .add-col-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 6px; border: 1px dashed var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-primary);
    transition: background var(--transition-standard);
  }
  .add-col-btn:hover { background: var(--color-primary-subtle); }

  .columns-list { display: flex; flex-direction: column; gap: 8px; }
  .col-row { display: flex; align-items: center; gap: 8px; }
  .col-color { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--color-surface-3); cursor: pointer; padding: 2px; }
  .col-name {
    flex: 1; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary); font-size: 0.875rem;
    font-family: inherit; outline: none;
  }
  .col-name:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard); flex-shrink: 0;
  }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  @media (max-width: 1019px) {
    .form { padding: 16px 14px; border-radius: 8px; }
  }
</style>
