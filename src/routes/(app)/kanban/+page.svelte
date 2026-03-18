<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { kanbanApi } from '$lib/api/kanban'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { KanbanBoard } from '$lib/types/kanban'
  import { formatTtlCountdown, formatDeletedAgo, isTtlExpired } from '$lib/utils/ttl'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Pencil, Trash2, Columns3, RotateCcw } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  const activeBoards  = $derived(data.boards.items.filter(b => !b.deleted))
  const deletedBoards = $derived(data.boards.items.filter(b => b.deleted))

  let deleteTarget = $state<KanbanBoard | null>(null)
  let deleting = $state(false)
  let restoringIds = $state<Set<string>>(new Set())

  function toggleDeleted() {
    const params = new URLSearchParams()
    if (!data.includeDeleted) params.set('includeDeleted', 'true')
    goto(`/kanban?${params}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleting = true
    deleteTarget = null
    try {
      await kanbanApi.removeBoard(target.id)
      let tid: string
      tid = toast.success(`"${target.title}" deleted.`, {
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

  async function undoDelete(board: KanbanBoard, toastId: string) {
    toast.dismiss(toastId)
    try {
      await kanbanApi.restoreBoard(board.id)
      toast.success(`"${board.title}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this board.')
    }
  }

  async function restoreBoard(board: KanbanBoard) {
    restoringIds = new Set([...restoringIds, board.id])
    try {
      await kanbanApi.restoreBoard(board.id)
      toast.success(`"${board.title}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this board.')
    } finally {
      restoringIds = new Set([...restoringIds].filter(id => id !== board.id))
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Kanban Boards</h1>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>
        Recently Deleted
      </button>
      <Button onclick={() => goto('/kanban/new')}><Plus size={20} /> New Board</Button>
    </div>
  </div>

  {#if activeBoards.length === 0 && !data.includeDeleted}
    <EmptyState title="No boards yet" message="Create your first Kanban board to start organising work." />
  {:else if activeBoards.length > 0}
    <div class="boards-grid">
      {#each activeBoards as board}
        <div
          class="board-card"
          onclick={() => goto(`/kanban/${board.id}`)}
          role="button"
          tabindex={0}
          onkeydown={(e) => e.key === 'Enter' && goto(`/kanban/${board.id}`)}
        >
          <div class="board-card-top">
            <span class="board-title">{board.title}</span>
          </div>
          {#if board.description}
            <p class="board-desc">{board.description}</p>
          {/if}
          <div class="board-footer">
            <div class="col-count">
              <Columns3 size={14} />
              <span>{board.columns.length} column{board.columns.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="board-meta">
              <span class="board-date">{formatDate(board.updated_at)}</span>
              <div class="board-actions" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
                <button class="icon-btn" title="Edit" onclick={() => goto(`/kanban/${board.id}`)}>
                  <Pencil size={16} />
                </button>
                <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = board}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
          {#if board.columns.length > 0}
            <div class="col-swatches">
              {#each board.columns.slice(0, 8) as col}
                <span class="col-swatch" style:background={col.color || 'var(--color-surface-3)'} title={col.name}></span>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <Pagination
      page={data.page}
      hasNext={!!data.boards.next_token}
      nextToken={data.boards.next_token}
      onprev={() => {
        const p = new URLSearchParams({ page: String(Math.max(0, data.page - 1)) })
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/kanban?${p}`)
      }}
      onnext={() => {
        const p = new URLSearchParams({ page: String(data.page + 1) })
        if (data.boards.next_token) p.set('next_token', data.boards.next_token)
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/kanban?${p}`)
      }}
    />
  {/if}

  <!-- Recently Deleted section -->
  {#if data.includeDeleted}
    <div class="recently-deleted">
      <h2 class="section-heading">Recently Deleted</h2>
      {#if deletedBoards.length === 0}
        <p class="empty-deleted">No recently deleted boards.</p>
      {:else}
        <div class="deleted-list">
          {#each deletedBoards as board}
            <div class="deleted-row">
              <div class="deleted-info">
                <span class="deleted-name">{board.title}</span>
                <span class="deleted-meta">{formatDeletedAgo(board.deleted_at)}</span>
                <span class="deleted-ttl" class:ttl-warning={board.ttl_expiry && (board.ttl_expiry * 1000 - Date.now()) < 2 * 86400000} class:ttl-danger={board.ttl_expiry && (board.ttl_expiry * 1000 - Date.now()) < 86400000}>
                  {formatTtlCountdown(board.ttl_expiry)}
                </span>
              </div>
              <Button
                variant="outlined"
                size="sm"
                disabled={isTtlExpired(board.ttl_expiry) || restoringIds.has(board.id)}
                loading={restoringIds.has(board.id)}
                onclick={() => restoreBoard(board)}
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
  title="Delete board?"
  message="This board will be permanently deleted in 7 days. You can restore it from Recently Deleted."
  confirmPhrase={`I want to delete ${deleteTarget?.title ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  .boards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .board-card {
    background: var(--color-surface-0);
    border: 1px solid var(--color-surface-3);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: box-shadow var(--transition-standard), border-color var(--transition-standard);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .board-card:hover { box-shadow: var(--shadow-2); border-color: var(--color-primary); }

  .board-card-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .board-title { font-size: 0.9375rem; font-weight: 500; }

  .board-desc {
    font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .board-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
  .col-count { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--color-text-secondary); }
  .board-meta { display: flex; align-items: center; gap: 8px; }
  .board-date { font-size: 0.75rem; color: var(--color-text-disabled); }
  .board-actions { display: flex; gap: 2px; }

  .col-swatches { display: flex; gap: 4px; flex-wrap: wrap; }
  .col-swatch { width: 16px; height: 4px; border-radius: 2px; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
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

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .header-actions { width: 100%; justify-content: flex-end; }
    .boards-grid { grid-template-columns: 1fr; }
  }
</style>
