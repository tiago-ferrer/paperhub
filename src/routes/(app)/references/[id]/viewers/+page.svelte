<script lang="ts">
  import type { PageData } from './$types'
  import { invalidateAll } from '$app/navigation'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Viewer } from '$lib/types/viewer'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import { formatDate } from '$lib/utils/format'
  import { UserPlus, Trash2 } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let newViewer    = $state('')
  let adding       = $state(false)
  let addError     = $state<string | null>(null)
  let revokeTarget = $state<Viewer | null>(null)

  async function addViewer(e: SubmitEvent) {
    e.preventDefault()
    addError = null
    adding = true
    try {
      await referencesApi.addViewer(data.reference.id, newViewer.trim())
      toast.success(`${newViewer} added as viewer`)
      newViewer = ''
      await invalidateAll()
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        addError = 'User not found'
      } else {
        addError = err instanceof ApiError ? err.message : 'Failed to add viewer'
      }
    } finally {
      adding = false
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) return
    try {
      await referencesApi.removeViewer(data.reference.id, revokeTarget.viewer_username)
      toast.success(`${revokeTarget.viewer_username} removed`)
      revokeTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to remove viewer')
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/references/{data.reference.id}" class="back-link">← {data.reference.title}</a>
    <h1>Manage Viewers</h1>
  </div>

  <div class="card">
    <h2 class="card-title">Add Viewer</h2>
    <form onsubmit={addViewer} class="add-form">
      <div class="add-input">
        <FormField label="Username" error={addError}>
          <input type="text" bind:value={newViewer} placeholder="Enter username…" />
        </FormField>
      </div>
      <Button type="submit" loading={adding} disabled={!newViewer.trim()}>
        <UserPlus size={20} /> Add Viewer
      </Button>
    </form>
  </div>

  <div class="card">
    <h2 class="card-title">Current Viewers ({data.viewers.length})</h2>
    {#if data.viewers.length === 0}
      <EmptyState title="No viewers yet" message="Add a viewer above to share read-only access." />
    {:else}
      <table class="viewer-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Granted</th>
            <th class="actions-col"></th>
          </tr>
        </thead>
        <tbody>
          {#each data.viewers as viewer}
            <tr>
              <td class="username">{viewer.viewer_username}</td>
              <td class="date">{formatDate(viewer.granted_at)}</td>
              <td>
                <button class="icon-btn danger" onclick={() => revokeTarget = viewer}>
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<ConfirmDialog
  open={!!revokeTarget}
  title="Revoke access?"
  message={revokeTarget ? `${revokeTarget.viewer_username} will lose read access to this reference.` : ''}
  confirmLabel="Revoke"
  onconfirm={confirmRevoke}
  oncancel={() => revokeTarget = null}
/>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 400; }

  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
  .card-title { font-size: 1rem; font-weight: 500; margin: 0 0 16px; }

  .add-form { display: flex; align-items: flex-end; gap: 12px; }
  .add-input { flex: 1; }

  .viewer-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 8px 12px; font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-surface-3); }
  td { padding: 12px; border-bottom: 1px solid var(--color-surface-2); }
  tr:last-child td { border-bottom: none; }
  .username { font-weight: 500; }
  .date { color: var(--color-text-secondary); font-size: 0.8125rem; }
  .actions-col { width: 1%; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }
</style>
