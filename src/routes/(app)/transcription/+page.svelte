<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { transcriptionApi } from '$lib/api/transcription'
  import { refreshTranscriptionGroups } from '$lib/stores/transcriptionGroups'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { TranscriptionGroup } from '$lib/types/transcription'
  import { formatTtlCountdown, formatDeletedAgo, isTtlExpired } from '$lib/utils/ttl'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Pencil, Trash2, Mic, RotateCcw } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  const activeGroups  = $derived(data.groups.items.filter(g => !g.deleted))
  const deletedGroups = $derived(data.groups.items.filter(g => g.deleted))

  let deleteTarget = $state<TranscriptionGroup | null>(null)
  let deleting = $state(false)
  let restoringIds = $state<Set<string>>(new Set())

  function toggleDeleted() {
    const params = new URLSearchParams()
    if (!data.includeDeleted) params.set('includeDeleted', 'true')
    goto(`/transcription?${params}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleting = true
    deleteTarget = null
    try {
      await transcriptionApi.removeGroup(target.id)
      let tid: string
      tid = toast.success(`"${target.name}" deleted.`, {
        duration: 8000,
        action: { label: 'Undo', onClick: () => undoDelete(target, tid) },
      })
      await refreshTranscriptionGroups()
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete group')
    } finally {
      deleting = false
    }
  }

  async function undoDelete(group: TranscriptionGroup, toastId: string) {
    toast.dismiss(toastId)
    try {
      await transcriptionApi.restoreGroup(group.id)
      toast.success(`"${group.name}" restored.`)
      await refreshTranscriptionGroups()
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this group.')
    }
  }

  async function restoreGroup(group: TranscriptionGroup) {
    restoringIds = new Set([...restoringIds, group.id])
    try {
      await transcriptionApi.restoreGroup(group.id)
      toast.success(`"${group.name}" restored.`)
      await refreshTranscriptionGroups()
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this group.')
    } finally {
      restoringIds = new Set([...restoringIds].filter(id => id !== group.id))
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Transcription</h1>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>
        Recently Deleted
      </button>
      <Button onclick={() => goto('/transcription/new')}><Plus size={20} /> New Group</Button>
    </div>
  </div>

  {#if activeGroups.length === 0 && !data.includeDeleted}
    <EmptyState title="No transcription groups yet" message="Create a group to start organising your audio recordings.">
      {#snippet actions()}
        <Button onclick={() => goto('/transcription/new')}><Plus size={20} /> New Group</Button>
      {/snippet}
    </EmptyState>
  {:else if activeGroups.length > 0}
    <!-- Desktop table -->
    <div class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Updated</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each activeGroups as group}
            <tr>
              <td class="name-cell">
                <a href="/transcription/{group.id}" class="group-link">
                  <Mic size={16} />
                  {group.name}
                </a>
              </td>
              <td class="desc-cell">{group.description ?? ''}</td>
              <td class="date-cell">{formatDate(group.updated_at)}</td>
              <td class="actions-cell">
                <button class="icon-btn" title="Open" onclick={() => goto(`/transcription/${group.id}`)}>
                  <Mic size={20} />
                </button>
                <button class="icon-btn" title="Edit" onclick={() => goto(`/transcription/${group.id}/edit`)}>
                  <Pencil size={20} />
                </button>
                <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = group}>
                  <Trash2 size={20} />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="card-list mobile-only">
      {#each activeGroups as group}
        <div class="group-card" onclick={() => goto(`/transcription/${group.id}`)}>
          <div class="card-top">
            <span class="card-title">{group.name}</span>
          </div>
          {#if group.description}
            <p class="card-desc">{group.description}</p>
          {/if}
          <div class="card-footer">
            <span class="card-date">{formatDate(group.updated_at)}</span>
            <div class="card-actions" onclick={(e) => e.stopPropagation()}>
              <button class="icon-btn" title="Edit" onclick={() => goto(`/transcription/${group.id}/edit`)}>
                <Pencil size={20} />
              </button>
              <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = group}>
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <Pagination
      page={data.page}
      hasNext={!!data.groups.next_token}
      nextToken={data.groups.next_token}
      onprev={() => {
        const p = new URLSearchParams({ page: String(Math.max(0, data.page - 1)) })
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/transcription?${p}`)
      }}
      onnext={() => {
        const p = new URLSearchParams({ page: String(data.page + 1) })
        if (data.groups.next_token) p.set('next_token', data.groups.next_token)
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/transcription?${p}`)
      }}
    />
  {/if}

  <!-- Recently Deleted section -->
  {#if data.includeDeleted}
    <div class="recently-deleted">
      <h2 class="section-heading">Recently Deleted</h2>
      {#if deletedGroups.length === 0}
        <p class="empty-deleted">No recently deleted groups.</p>
      {:else}
        <div class="deleted-list">
          {#each deletedGroups as group}
            <div class="deleted-row">
              <div class="deleted-info">
                <span class="deleted-name">{group.name}</span>
                <span class="deleted-meta">{formatDeletedAgo(group.deleted_at)}</span>
                <span class="deleted-ttl" class:ttl-warning={group.ttl_expiry && (group.ttl_expiry * 1000 - Date.now()) < 2 * 86400000} class:ttl-danger={group.ttl_expiry && (group.ttl_expiry * 1000 - Date.now()) < 86400000}>
                  {formatTtlCountdown(group.ttl_expiry)}
                </span>
              </div>
              <Button
                variant="outlined"
                size="sm"
                disabled={isTtlExpired(group.ttl_expiry) || restoringIds.has(group.id)}
                loading={restoringIds.has(group.id)}
                onclick={() => restoreGroup(group)}
              >
                <RotateCcw size={14} /> Restore
              </Button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<DestructiveConfirmDialog
  open={!!deleteTarget}
  title="Delete group?"
  message="This group will be permanently deleted in 7 days. You can restore it from Recently Deleted."
  confirmPhrase={`I want to delete ${deleteTarget?.name ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; }
  .header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  .desktop-only { display: block; }
  .mobile-only  { display: none; }
  @media (max-width: 1019px) {
    .desktop-only { display: none; }
    .mobile-only  { display: flex; flex-direction: column; gap: 12px; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .header-actions { width: 100%; justify-content: flex-end; }
  }

  .table-wrapper { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; overflow: hidden; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-surface-3); background: var(--color-surface-1); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--color-surface-2); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--color-surface-1); }

  .name-cell { max-width: 220px; }
  .desc-cell { max-width: 300px; color: var(--color-text-secondary); font-size: 0.8125rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .date-cell { white-space: nowrap; color: var(--color-text-secondary); font-size: 0.8125rem; }
  .group-link { color: var(--color-text-primary); text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
  .group-link:hover { color: var(--color-primary); }
  .actions-col { width: 1%; }
  .actions-cell { display: flex; align-items: center; gap: 2px; }

  .group-card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 14px 16px; cursor: pointer;
    transition: background var(--transition-standard);
  }
  .group-card:hover { background: var(--color-surface-1); }
  .card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .card-title { font-size: 0.9375rem; font-weight: 500; }
  .card-desc { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-footer { display: flex; align-items: center; justify-content: space-between; }
  .card-date { font-size: 0.75rem; color: var(--color-text-disabled); }
  .card-actions { display: flex; gap: 4px; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  /* Recently Deleted */
  .recently-deleted { margin-top: 40px; border-top: 1px solid var(--color-surface-3); padding-top: 24px; }
  .section-heading { margin: 0 0 16px; font-size: 1rem; font-weight: 500; color: var(--color-text-secondary); }
  .empty-deleted { font-size: 0.875rem; color: var(--color-text-disabled); margin: 0; }
  .deleted-list { display: flex; flex-direction: column; gap: 2px; }
  .deleted-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 10px 14px; border-radius: 8px;
    background: var(--color-surface-1); border: 1px solid var(--color-surface-2);
  }
  .deleted-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .deleted-name { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); text-decoration: line-through; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .deleted-meta { font-size: 0.75rem; color: var(--color-text-disabled); }
  .deleted-ttl { font-size: 0.75rem; color: var(--color-text-secondary); }
  .deleted-ttl.ttl-warning { color: var(--color-warning); }
  .deleted-ttl.ttl-danger  { color: var(--color-error); }
</style>
