<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { ganttApi } from '$lib/api/gantt'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { GanttChart } from '$lib/types/gantt'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import Modal from '$lib/components/dialogs/Modal.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Pencil, Trash2 } from 'lucide-svelte'

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

  // ── Delete ───────────────────────────────────────────────────────────────────
  let deleteTarget = $state<GanttChart | null>(null)
  let deleting     = $state(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    deleting = true
    try {
      await ganttApi.removeChart(deleteTarget.id)
      toast.success('Chart deleted')
      deleteTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong, please try again')
    } finally {
      deleting = false
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
        Show deleted
      </button>
      <Button onclick={() => { newTitle = ''; newDesc = ''; newErrors = {}; newOpen = true }}>
        <Plus size={20} /> New Chart
      </Button>
    </div>
  </div>

  {#if data.charts.items.length === 0}
    <EmptyState title="No charts yet" message="Create your first Gantt chart to start planning timelines." />
  {:else}
    <div class="charts-grid">
      {#each data.charts.items as chart}
        <div
          class="chart-card"
          class:deleted-card={chart.deleted}
          onclick={() => !chart.deleted && goto(`/gantt/${chart.id}`)}
          role="button"
          tabindex={chart.deleted ? -1 : 0}
          onkeydown={(e) => e.key === 'Enter' && !chart.deleted && goto(`/gantt/${chart.id}`)}
        >
          <div class="chart-card-top">
            <span class="chart-title" class:deleted-text={chart.deleted}>{chart.title}</span>
            {#if chart.deleted}<span class="deleted-badge">deleted</span>{/if}
          </div>
          {#if chart.description}
            <p class="chart-desc">{chart.description}</p>
          {/if}
          <div class="chart-footer">
            <span class="chart-date">{formatDate(chart.updated_at)}</span>
            <div class="chart-actions" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="presentation">
              {#if !chart.deleted}
                <button class="icon-btn" title="Open" onclick={() => goto(`/gantt/${chart.id}`)}>
                  <Pencil size={16} />
                </button>
                <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = chart}>
                  <Trash2 size={16} />
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <Pagination
      page={data.page}
      hasNext={data.charts.items.length === 20}
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
<ConfirmDialog
  open={!!deleteTarget}
  title="Delete chart?"
  message={`"${deleteTarget?.title}" and all its tasks will be soft-deleted.`}
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
  .deleted-card { opacity: 0.55; cursor: default; }
  .deleted-card:hover { box-shadow: none; border-color: var(--color-surface-3); }

  .chart-card-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .chart-title { font-size: 0.9375rem; font-weight: 500; }
  .deleted-text { text-decoration: line-through; color: var(--color-text-disabled); }
  .deleted-badge {
    display: inline-block; padding: 1px 6px; border-radius: 10px;
    font-size: 0.6875rem; background: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error); font-weight: 500;
  }

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
