<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { ganttApi } from '$lib/api/gantt'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { GanttChart } from '$lib/types/gantt'
  import { formatTtlCountdown, formatDeletedAgo, isTtlExpired } from '$lib/utils/ttl'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import Modal from '$lib/components/dialogs/Modal.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  // ── New chart modal ──────────────────────────────────────────────────────────
  let newOpen   = $state(false)
  let newTitle  = $state('')
  let newDesc   = $state('')
  let creating  = $state(false)
  let newErrors = $state<Record<string, string>>({})

  async function createChart() {
    creating = true
    newErrors = {}
    try {
      const chart = await ganttApi.createChart({ title: newTitle, description: newDesc || undefined })
      toast.success('Chart created')
      newOpen = false
      newTitle = ''
      newDesc = ''
      goto(`/gantt/${chart.id}`)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.fields) newErrors = e.fields
        else toast.error(e.message)
      } else {
        toast.error('Something went wrong, please try again')
      }
    } finally {
      creating = false
    }
  }

  // ── Split active / deleted ───────────────────────────────────────────────────
  const activeCharts  = $derived(data.charts.items.filter(c => !c.deleted))
  const deletedCharts = $derived(data.charts.items.filter(c => c.deleted))

  // ── Delete with undo toast ───────────────────────────────────────────────────
  let deleteTarget = $state<GanttChart | null>(null)
  let deleting     = $state(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleting = true
    deleteTarget = null
    try {
      await ganttApi.removeChart(target.id)
      let tid: string
      tid = toast.success(`"${target.title}" deleted.`, {
        duration: 8000,
        action: { label: 'Undo', onClick: () => undoDelete(target, tid) },
      })
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong, please try again')
    } finally {
      deleting = false
    }
  }

  async function undoDelete(chart: GanttChart, toastId: string) {
    toast.dismiss(toastId)
    try {
      await ganttApi.restoreChart(chart.id)
      toast.success(`"${chart.title}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this chart.')
    }
  }

  // ── Restore from recently deleted ───────────────────────────────────────────
  let restoringIds = $state<Set<string>>(new Set())

  async function restoreChart(chart: GanttChart) {
    restoringIds = new Set([...restoringIds, chart.id])
    try {
      await ganttApi.restoreChart(chart.id)
      toast.success(`"${chart.title}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this chart.')
    } finally {
      restoringIds = new Set([...restoringIds].filter(id => id !== chart.id))
    }
  }

  function toggleDeleted() {
    const params = new URLSearchParams()
    if (!data.includeDeleted) params.set('includeDeleted', 'true')
    goto(`/gantt?${params}`)
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Gantt Charts</h1>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>
        Recently Deleted
      </button>
      <Button onclick={() => { newTitle = ''; newDesc = ''; newErrors = {}; newOpen = true }}>
        <Plus size={20} /> New Chart
      </Button>
    </div>
  </div>

  {#if activeCharts.length === 0 && !data.includeDeleted}
    <EmptyState title="No charts yet" message="Create your first Gantt chart to start planning timelines." />
  {:else if activeCharts.length > 0}
    <div class="charts-grid">
      {#each activeCharts as chart}
        <div
          class="chart-card"
          onclick={() => goto(`/gantt/${chart.id}`)}
          role="button"
          tabindex={0}
          onkeydown={(e) => e.key === 'Enter' && goto(`/gantt/${chart.id}`)}
        >
          <div class="chart-card-top">
            <span class="chart-title">{chart.title}</span>
          </div>
          {#if chart.description}
            <p class="chart-desc">{chart.description}</p>
          {/if}
          <div class="chart-footer">
            <span class="chart-date">{formatDate(chart.updated_at)}</span>
            <div class="chart-actions" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
              <button class="icon-btn" title="Open" onclick={() => goto(`/gantt/${chart.id}`)}>
                <Pencil size={16} />
              </button>
              <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = chart}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <Pagination
      page={data.page}
      hasNext={activeCharts.length === 20}
      onprev={() => {
        const p = new URLSearchParams({ page: String(Math.max(0, data.page - 1)) })
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/gantt?${p}`)
      }}
      onnext={() => {
        const p = new URLSearchParams({ page: String(data.page + 1) })
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/gantt?${p}`)
      }}
    />
  {/if}

  <!-- Recently Deleted section -->
  {#if data.includeDeleted}
    <div class="recently-deleted">
      <h2 class="section-heading">Recently Deleted</h2>
      {#if deletedCharts.length === 0}
        <p class="empty-deleted">No recently deleted charts.</p>
      {:else}
        <div class="deleted-list">
          {#each deletedCharts as chart}
            <div class="deleted-row">
              <div class="deleted-info">
                <span class="deleted-name">{chart.title}</span>
                <span class="deleted-meta">{formatDeletedAgo(chart.deleted_at)}</span>
                <span class="deleted-ttl" class:ttl-warning={chart.ttl_expiry && (chart.ttl_expiry * 1000 - Date.now()) < 2 * 86400000} class:ttl-danger={chart.ttl_expiry && (chart.ttl_expiry * 1000 - Date.now()) < 86400000}>
                  {formatTtlCountdown(chart.ttl_expiry)}
                </span>
              </div>
              <Button
                variant="outlined"
                size="sm"
                disabled={isTtlExpired(chart.ttl_expiry) || restoringIds.has(chart.id)}
                loading={restoringIds.has(chart.id)}
                onclick={() => restoreChart(chart)}
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

<!-- New Chart Modal -->
<Modal open={newOpen} title="New Gantt Chart" onclose={() => newOpen = false}>
  <form onsubmit={(e) => { e.preventDefault(); createChart() }} class="modal-form">
    <div class="form-group">
      <label for="new-title">Title *</label>
      <input id="new-title" bind:value={newTitle} placeholder="e.g. Thesis Timeline" required />
      {#if newErrors.title}<span class="field-error">{newErrors.title}</span>{/if}
    </div>
    <div class="form-group">
      <label for="new-desc">Description</label>
      <textarea id="new-desc" bind:value={newDesc} rows="3" placeholder="Optional description"></textarea>
      {#if newErrors.description}<span class="field-error">{newErrors.description}</span>{/if}
    </div>
    <div class="form-actions">
      <Button type="submit" loading={creating} disabled={!newTitle.trim()}>Create Chart</Button>
      <Button variant="text" onclick={() => newOpen = false}>Cancel</Button>
    </div>
  </form>
</Modal>

<!-- Delete Confirm -->
<DestructiveConfirmDialog
  open={!!deleteTarget}
  title="Delete chart?"
  message="This chart will be permanently deleted in 7 days. You can restore it from Recently Deleted."
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

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .chart-card {
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
  .chart-card:hover { box-shadow: var(--shadow-2); border-color: var(--color-primary); }

  .chart-card-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .chart-title { font-size: 0.9375rem; font-weight: 500; }

  .chart-desc {
    font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .chart-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
  .chart-date { font-size: 0.75rem; color: var(--color-text-disabled); }
  .chart-actions { display: flex; gap: 2px; }

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
    background: var(--color-surface-1);
    border: 1px solid var(--color-surface-2);
  }
  .deleted-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .deleted-name { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); text-decoration: line-through; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .deleted-meta { font-size: 0.75rem; color: var(--color-text-disabled); }
  .deleted-ttl { font-size: 0.75rem; color: var(--color-text-secondary); }
  .deleted-ttl.ttl-warning { color: var(--color-warning); }
  .deleted-ttl.ttl-danger  { color: var(--color-error); }

  /* Modal form */
  .modal-form { display: flex; flex-direction: column; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group label { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
  .form-group input,
  .form-group textarea {
    padding: 8px 12px; border: 1px solid var(--color-surface-3); border-radius: 6px;
    font-size: 14px; background: var(--color-surface-0); color: var(--color-text-primary);
    width: 100%; box-sizing: border-box;
  }
  .form-group input:focus,
  .form-group textarea:focus { outline: none; border-color: var(--color-primary); }
  .field-error { font-size: 12px; color: var(--color-error); }
  .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .header-actions { width: 100%; justify-content: flex-end; }
    .charts-grid { grid-template-columns: 1fr; }
  }
</style>
