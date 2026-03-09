<script lang="ts">
  import { goto } from '$app/navigation'
  import { notebooksApi } from '$lib/api/notebooks'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'

  let title       = $state('')
  let description = $state('')
  let saving      = $state(false)
  let errors      = $state<Record<string, string>>({})

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
      const nb = await notebooksApi.create({ title: title.trim(), description: description.trim() || undefined })
      toast.success('Notebook created')
      goto(`/notebooks/${nb.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create notebook')
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/notebooks" class="back-link">← Notebooks</a>
    <h1>New Notebook</h1>
  </div>

  <form onsubmit={submit} class="form">
    <div class="form-grid">
      <FormField label="Title" required error={errors.title}>
        <input type="text" bind:value={title} placeholder="My Research Notes" />
      </FormField>
      <FormField label="Description">
        <textarea bind:value={description} rows={3} placeholder="A brief description…"></textarea>
      </FormField>
    </div>
    <div class="form-actions">
      <Button variant="outlined" onclick={() => goto('/notebooks')}>Cancel</Button>
      <Button type="submit" loading={saving}>Create Notebook</Button>
    </div>
  </form>
</div>

<style>
  .page { max-width: 640px; }
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

  @media (max-width: 1019px) {
    .page { max-width: 100%; }
    .form { padding: 16px 14px; border-radius: 8px; }
  }
</style>
