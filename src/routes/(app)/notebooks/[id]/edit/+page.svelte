<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { notebooksApi } from '$lib/api/notebooks'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Notebook } from '$lib/types/notebook'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { onMount } from 'svelte'

  const id = $page.params.id as string

  let original  = $state<Notebook | null>(null)
  let loading   = $state(true)
  let saving    = $state(false)
  let errors    = $state<Record<string, string>>({})

  let title       = $state('')
  let description = $state('')

  onMount(async () => {
    try {
      const nb = await notebooksApi.get(id)
      original    = nb
      title       = nb.title
      description = nb.description ?? ''
    } catch {
      toast.error('Failed to load notebook')
      goto('/notebooks')
    } finally {
      loading = false
    }
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    if (!original) return
    errors = validate()
    if (Object.keys(errors).length) return

    const patch: Record<string, string> = {}
    if (title.trim() !== original.title) patch.title = title.trim()
    if ((description.trim() || '') !== (original.description || '')) patch.description = description.trim()

    if (!Object.keys(patch).length) {
      toast.info('No changes to save')
      return
    }

    saving = true
    try {
      await notebooksApi.patch(id, patch)
      toast.success('Notebook updated')
      await invalidateAll()
      goto(`/notebooks/${id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update')
    } finally {
      saving = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/notebooks/{id}" class="back-link">← Notebook</a>
    <h1>Edit Notebook</h1>
  </div>

  {#if loading}
    <div class="loading"><Spinner size={41} /></div>
  {:else}
    <form onsubmit={submit} class="form">
      <div class="form-grid">
        <FormField label="Title" required error={errors.title}>
          <input type="text" bind:value={title} />
        </FormField>
        <FormField label="Description">
          <textarea bind:value={description} rows={3}></textarea>
        </FormField>
      </div>
      <div class="form-actions">
        <Button variant="outlined" onclick={() => goto(`/notebooks/${id}`)}>Cancel</Button>
        <Button type="submit" loading={saving}>Save Changes</Button>
      </div>
    </form>
  {/if}
</div>

<style>
  .page { max-width: 640px; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; }
  .loading { display: flex; justify-content: center; padding: 80px; }

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
