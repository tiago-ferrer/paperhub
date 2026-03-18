<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { transcriptionApi } from '$lib/api/transcription'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Transcription } from '$lib/types/transcription'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import AddToProjectModal from '$lib/components/projects/AddToProjectModal.svelte'
  import { Plus, Pencil, Trash2, Mic, FolderOpen, RotateCcw } from 'lucide-svelte'
  import { formatTtlCountdown, ttlUrgency, isTtlExpired, formatDeletedAgo } from '$lib/utils/ttl'

  let { data }: { data: PageData } = $props()
  let group = $derived(data.group)

  let transcriptions = $state([...data.transcriptions.items])
  let deleteTarget = $state<Transcription | null>(null)
  let deleting = $state(false)
  let showAddToProject = $state(false)
  let restoringIds = $state<Set<string>>(new Set())

  const activeTranscriptions = $derived(transcriptions.filter(t => !t.deleted))
  const deletedTranscriptions = $derived(transcriptions.filter(t => t.deleted))

  // Keep list in sync when data prop changes (navigating pages)
  $effect(() => { transcriptions = [...data.transcriptions.items] })

  // Poll any PROCESSING items every 5 s
  $effect(() => {
    const processingIds = activeTranscriptions
      .filter(t => t.transcript_status === 'PROCESSING')
      .map(t => t.id)
    if (processingIds.length === 0) return

    const id = setInterval(async () => {
      for (const tid of processingIds) {
        try {
          const updated = await transcriptionApi.getTranscription(group.id, tid)
          const idx = transcriptions.findIndex(t => t.id === tid)
          if (idx !== -1) transcriptions[idx] = updated
        } catch { /* ignore poll errors */ }
      }
    }, 5000)
    return () => clearInterval(id)
  })

  function toggleDeleted() {
    const p = new URLSearchParams()
    if (!data.includeDeleted) p.set('includeDeleted', 'true')
    goto(`/transcription/${group.id}?${p}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleting = true
    deleteTarget = null
    try {
      await transcriptionApi.removeTranscription(group.id, target.id)
      let tid: string
      tid = toast.success(`"${target.name}" deleted.`, {
        duration: 8000,
        action: { label: 'Undo', onClick: () => undoDelete(target, tid) },
      })
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete')
    } finally {
      deleting = false
    }
  }

  async function undoDelete(transcription: Transcription, toastId: string) {
    toast.dismiss(toastId)
    try {
      await transcriptionApi.restoreTranscription(group.id, transcription.id)
      toast.success(`"${transcription.name}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this recording.')
    }
  }

  async function restoreTranscription(rec: Transcription) {
    restoringIds = new Set([...restoringIds, rec.id])
    try {
      await transcriptionApi.restoreTranscription(group.id, rec.id)
      toast.success(`"${rec.name}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this recording.')
    } finally {
      restoringIds = new Set([...restoringIds].filter(id => id !== rec.id))
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <div class="header-left">
      <a href="/transcription" class="back-link">← Transcription</a>
      <div class="title-row">
        <h1>{group.name}</h1>
        {#if group.deleted}<span class="deleted-badge">deleted</span>{/if}
      </div>
      {#if group.description}<p class="group-desc">{group.description}</p>{/if}
    </div>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>
        Recently Deleted
      </button>
      <Button variant="outlined" size="sm" onclick={() => showAddToProject = true}>
        <FolderOpen size={18} /><span class="btn-label"> Add to Project</span>
      </Button>
      {#if !group.deleted}
        <Button variant="outlined" size="sm" onclick={() => goto(`/transcription/${group.id}/edit`)}>
          <Pencil size={18} /><span class="btn-label"> Edit</span>
        </Button>
        <Button size="sm" onclick={() => goto(`/transcription/${group.id}/new`)}>
          <Plus size={18} /><span class="btn-label"> New Recording</span>
        </Button>
      {/if}
    </div>
  </div>

  {#if activeTranscriptions.length === 0 && !data.includeDeleted}
    <EmptyState title="No recordings yet" message="Upload an audio file to start transcribing.">
      {#snippet actions()}
        {#if !group.deleted}
          <Button onclick={() => goto(`/transcription/${group.id}/new`)}><Plus size={20} /> New Recording</Button>
        {/if}
      {/snippet}
    </EmptyState>
  {:else if activeTranscriptions.length > 0}
    <div class="recording-list">
      {#each activeTranscriptions as rec}
        <div
          class="rec-card"
          onclick={() => goto(`/transcription/${group.id}/${rec.id}`)}
        >
          <div class="rec-header">
            <div class="rec-title-row">
              <Mic size={18} class="rec-icon" />
              <span class="rec-title">{rec.name}</span>
            </div>
            <div class="rec-actions" onclick={(e) => e.stopPropagation()}>
              <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = rec}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div class="rec-footer">
            <span class="rec-date">{rec.date}</span>
            <span
              class="status-badge"
              class:status-pending={rec.transcript_status === 'PENDING'}
              class:status-processing={rec.transcript_status === 'PROCESSING'}
              class:status-completed={rec.transcript_status === 'COMPLETED'}
              class:status-failed={rec.transcript_status === 'FAILED'}
            >
              {#if rec.transcript_status === 'PROCESSING'}
                <Spinner size={11} />
              {/if}
              {rec.transcript_status}
            </span>
          </div>
        </div>
      {/each}
    </div>

    <Pagination
      page={data.page}
      hasNext={!!data.transcriptions.next_token}
      nextToken={data.transcriptions.next_token}
      onprev={() => {
        const p = new URLSearchParams({ page: String(Math.max(0, data.page - 1)) })
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/transcription/${group.id}?${p}`)
      }}
      onnext={() => {
        const p = new URLSearchParams({ page: String(data.page + 1) })
        if (data.transcriptions.next_token) p.set('next_token', data.transcriptions.next_token)
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/transcription/${group.id}?${p}`)
      }}
    />
  {/if}

  {#if data.includeDeleted}
    <div class="recently-deleted">
      <h2 class="section-heading">Recently Deleted</h2>
      {#if deletedTranscriptions.length === 0}
        <p class="empty-deleted">No recently deleted recordings.</p>
      {:else}
        <div class="deleted-list">
          {#each deletedTranscriptions as rec}
            <div class="deleted-row">
              <div class="deleted-info">
                <span class="deleted-name">{rec.name}</span>
                <span class="deleted-meta">{formatDeletedAgo(rec.deleted_at)}</span>
                <span
                  class="deleted-ttl"
                  class:ttl-warning={ttlUrgency(rec.ttl_expiry) === 'warning'}
                  class:ttl-danger={ttlUrgency(rec.ttl_expiry) === 'danger' || ttlUrgency(rec.ttl_expiry) === 'expired'}
                >
                  {formatTtlCountdown(rec.ttl_expiry)}
                </span>
              </div>
              <Button
                variant="outlined"
                size="sm"
                disabled={isTtlExpired(rec.ttl_expiry) || restoringIds.has(rec.id)}
                loading={restoringIds.has(rec.id)}
                onclick={() => restoreTranscription(rec)}
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
  title="Delete recording?"
  message="This recording will be permanently deleted in 7 days. You can restore it from Recently Deleted."
  confirmPhrase={`I want to delete ${deleteTarget?.name ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<AddToProjectModal
  open={showAddToProject}
  entityType="TRANSCRIPTION_GROUP"
  entityId={group.id}
  onclose={() => showAddToProject = false}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
  .header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
  .title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .group-desc { margin: 4px 0 0; font-size: 0.875rem; color: var(--color-text-secondary); }
  .header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  .deleted-badge {
    display: inline-block; padding: 1px 6px; border-radius: 10px;
    font-size: 0.6875rem; background: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error); font-weight: 500;
  }

  .recording-list { display: flex; flex-direction: column; gap: 10px; }

  .rec-card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 14px 18px; cursor: pointer;
    transition: background var(--transition-standard);
  }
  .rec-card:hover { background: var(--color-surface-1); }

  .rec-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
  .rec-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .rec-title { font-size: 0.9375rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .rec-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .rec-date { font-size: 0.8125rem; color: var(--color-text-secondary); }

  .status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em;
    padding: 3px 9px; border-radius: 20px; text-transform: uppercase;
  }
  .status-pending   { background: var(--color-surface-2); color: var(--color-text-secondary); }
  .status-processing{ background: color-mix(in srgb, var(--color-info) 12%, transparent); color: var(--color-info); }
  .status-completed { background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success); }
  .status-failed    { background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); }

  .rec-actions { display: flex; gap: 4px; flex-shrink: 0; }
  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  :global(.rec-icon) { color: var(--color-text-secondary); flex-shrink: 0; }

  /* Recently Deleted */
  .recently-deleted { margin-top: 40px; }
  .section-heading { font-size: 1rem; font-weight: 500; color: var(--color-text-secondary); margin: 0 0 12px; }
  .empty-deleted { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; }
  .deleted-list { display: flex; flex-direction: column; gap: 8px; }
  .deleted-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 8px; padding: 10px 14px;
  }
  .deleted-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .deleted-name { font-size: 0.9375rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-secondary); text-decoration: line-through; }
  .deleted-meta { font-size: 0.75rem; color: var(--color-text-secondary); }
  .deleted-ttl { font-size: 0.75rem; color: var(--color-text-secondary); }
  .ttl-warning { color: var(--color-warning, #d97706); }
  .ttl-danger  { color: var(--color-error); }

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    .header-actions { width: 100%; justify-content: flex-end; }
    .btn-label { display: none; }
    .rec-card { padding: 12px 14px; }
  }
</style>
