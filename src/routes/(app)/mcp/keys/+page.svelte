<script lang="ts">
  import type { PageData } from './$types'
  import { invalidateAll } from '$app/navigation'
  import { apiKeysApi } from '$lib/api/apikeys'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { ApiKeyCreated, McpPrivilege } from '$lib/types/apikey'
  import Button from '$lib/components/ui/Button.svelte'
  import StatusChip from '$lib/components/ui/StatusChip.svelte'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import Modal from '$lib/components/dialogs/Modal.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Trash2, Copy, AlertTriangle } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let createOpen   = $state(false)
  let newName      = $state('')
  let newPrivilege = $state<McpPrivilege>('OWNER')
  let creating     = $state(false)
  let createdKey   = $state<ApiKeyCreated | null>(null)
  let deleteTarget = $state<string | null>(null)

  async function createKey(e: SubmitEvent) {
    e.preventDefault()
    creating = true
    try {
      const key = await apiKeysApi.create({ name: newName.trim(), privilege: newPrivilege })
      createOpen = false
      newName = ''
      newPrivilege = 'OWNER'
      createdKey = key
      await invalidateAll()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create key')
    } finally {
      creating = false
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await apiKeysApi.delete(deleteTarget)
      toast.success('API key deleted')
      deleteTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete key')
    }
  }

  function copyKey() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey.key_value)
      toast.success('Copied to clipboard')
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>MCP API Keys</h1>
    <Button onclick={() => createOpen = true}><Plus size={20} /> New API Key</Button>
  </div>

  <div class="warning-banner">
    <AlertTriangle size={20} />
    API key values are shown once. Store them securely immediately after creation.
  </div>

  {#if data.apiKeys.length === 0}
    <EmptyState title="No API keys" message="Create an API key to access PaperHub via the MCP interface.">
      {#snippet actions()}
        <Button onclick={() => createOpen = true}><Plus size={20} /> New API Key</Button>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Privilege</th>
            <th>Created</th>
            <th class="actions-col"></th>
          </tr>
        </thead>
        <tbody>
          {#each data.apiKeys as key}
            <tr>
              <td class="name">{key.name}</td>
              <td><StatusChip label={key.privilege} variant={key.privilege === 'OWNER' ? 'info' : 'neutral'} /></td>
              <td class="date">{formatDate(key.created_at)}</td>
              <td>
                <button class="icon-btn danger" onclick={() => deleteTarget = key.id}><Trash2 size={20} /></button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<SlideOver open={createOpen} title="New API Key" onclose={() => createOpen = false}>
  <form onsubmit={createKey} class="create-form">
    <FormField label="Name" required>
      <input type="text" bind:value={newName} placeholder="e.g. My MCP client" required />
    </FormField>
    <FormField label="Privilege">
      <select bind:value={newPrivilege}>
        <option value="OWNER">Owner</option>
        <option value="VIEWER">Viewer</option>
      </select>
    </FormField>
    <div class="form-actions">
      <Button variant="outlined" onclick={() => createOpen = false}>Cancel</Button>
      <Button type="submit" loading={creating} disabled={!newName.trim()}>Create Key</Button>
    </div>
  </form>
</SlideOver>

{#if createdKey}
  <Modal open={!!createdKey} title="API Key Created — Save This Now" onclose={() => createdKey = null}>
    <div class="reveal-body">
      <p class="reveal-warning"><AlertTriangle size={20} /> This key will <strong>not</strong> be shown again.</p>
      <div class="key-display">
        <code>{createdKey.key_value}</code>
        <button class="copy-btn" onclick={copyKey}><Copy size={20} /></button>
      </div>
      <div class="reveal-actions">
        <Button onclick={() => createdKey = null}>I've saved it</Button>
      </div>
    </div>
  </Modal>
{/if}

<ConfirmDialog
  open={!!deleteTarget}
  title="Delete API key?"
  message="This key will be permanently revoked."
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 400; }

  .warning-banner {
    display: flex; align-items: center; gap: 8px;
    background: color-mix(in srgb, var(--color-warning) 15%, transparent);
    color: color-mix(in srgb, var(--color-warning) 80%, var(--color-text-primary));
    padding: 10px 16px; border-radius: 8px; font-size: 0.875rem; margin-bottom: 20px;
  }

  .table-wrapper { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; overflow: hidden; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-surface-3); background: var(--color-surface-1); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--color-surface-2); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--color-surface-1); }
  .name { font-weight: 500; }
  .date { color: var(--color-text-secondary); font-size: 0.8125rem; }
  .actions-col { width: 1%; }

  .create-form { display: flex; flex-direction: column; gap: 20px; }
  :global(.create-form select) {
    width: 100%; padding: 8px 12px; border-radius: 6px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .form-actions { display: flex; justify-content: flex-end; gap: 8px; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  .reveal-body { display: flex; flex-direction: column; gap: 16px; }
  .reveal-warning { display: flex; align-items: center; gap: 8px; color: var(--color-error); font-size: 0.875rem; font-weight: 500; margin: 0; }
  .key-display { display: flex; align-items: center; gap: 8px; background: var(--color-surface-1); border: 1px solid var(--color-surface-3); border-radius: 8px; padding: 12px 16px; }
  .key-display code { flex: 1; font-family: monospace; font-size: 0.8125rem; word-break: break-all; }
  .copy-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer; background: transparent; color: var(--color-text-secondary); flex-shrink: 0; }
  .copy-btn:hover { background: var(--color-surface-2); }
  .reveal-actions { display: flex; justify-content: flex-end; }
</style>
