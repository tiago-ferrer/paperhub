<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { papersApi } from '$lib/api/papers'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Paper } from '$lib/types/paper'
  import Button from '$lib/components/ui/Button.svelte'
  import StatusChip from '$lib/components/ui/StatusChip.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Eye, Pencil, Trash2, Users } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  type Filter = 'all' | 'owner' | 'shared'
  let filter = $state<Filter>('all')
  let deleteTarget = $state<Paper | null>(null)
  let deleting = $state(false)

  const filtered = $derived.by(() => {
    const items = data.papers.items
    if (filter === 'owner')  return items.filter(p => p.role === 'OWNER')
    if (filter === 'shared') return items.filter(p => p.role === 'VIEWER')
    return items
  })

  async function confirmDelete() {
    if (!deleteTarget) return
    deleting = true
    try {
      await papersApi.remove(deleteTarget.id)
      toast.success('Paper deleted')
      deleteTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete')
    } finally {
      deleting = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Papers</h1>
    <Button onclick={() => goto('/papers/new')}><Plus size={20} /> New Paper</Button>
  </div>

  <div class="filters">
    {#each (['all', 'owner', 'shared'] as Filter[]) as f}
      <button class="filter-chip" class:active={filter === f} onclick={() => filter = f}>
        {f === 'all' ? 'All' : f === 'owner' ? 'Owner' : 'Shared with me'}
      </button>
    {/each}
  </div>

  {#if filtered.length === 0}
    <EmptyState title="No papers found" message="Create your first paper to get started." />
  {:else}
    <!-- Desktop table -->
    <div class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Year</th>
            <th>Journal</th>
            <th>Role</th>
            <th>Updated</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as paper}
            <tr>
              <td class="title-cell"><a href="/papers/{paper.id}" class="paper-link">{paper.title}</a></td>
              <td>{paper.category}</td>
              <td>{paper.year}</td>
              <td class="journal-cell">{paper.journal}</td>
              <td><StatusChip label={paper.role} variant={paper.role === 'OWNER' ? 'info' : 'neutral'} /></td>
              <td class="date-cell">{formatDate(paper.updated_at)}</td>
              <td class="actions-cell">
                <button class="icon-btn" title="View" onclick={() => goto(`/papers/${paper.id}`)}>
                  <Eye size={20} />
                </button>
                {#if paper.role === 'OWNER'}
                  <button class="icon-btn" title="Edit" onclick={() => goto(`/papers/${paper.id}/edit`)}>
                    <Pencil size={20} />
                  </button>
                  <button class="icon-btn" title="Viewers" onclick={() => goto(`/papers/${paper.id}/viewers`)}>
                    <Users size={20} />
                  </button>
                  <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = paper}>
                    <Trash2 size={20} />
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="card-list mobile-only">
      {#each filtered as paper}
        <div class="paper-card" onclick={() => goto(`/papers/${paper.id}`)}>
          <div class="card-top">
            <a href="/papers/{paper.id}" class="paper-link card-title">{paper.title}</a>
            <StatusChip label={paper.role} variant={paper.role === 'OWNER' ? 'info' : 'neutral'} />
          </div>
          <div class="card-meta">
            <span>{paper.year}</span>
            <span class="dot">·</span>
            <span class="card-journal">{paper.journal}</span>
          </div>
          <div class="card-footer">
            <span class="card-date">{formatDate(paper.updated_at)}</span>
            <div class="card-actions" onclick={(e) => e.stopPropagation()}>
              {#if paper.role === 'OWNER'}
                <button class="icon-btn" title="Edit" onclick={() => goto(`/papers/${paper.id}/edit`)}>
                  <Pencil size={20} />
                </button>
                <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = paper}>
                  <Trash2 size={20} />
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <Pagination
      page={data.page}
      hasNext={!!data.papers.next_token}
      nextToken={data.papers.next_token}
      onprev={() => goto(`/papers?page=${Math.max(0, data.page - 1)}`)}
      onnext={() => {
        const p = new URLSearchParams({ page: String(data.page + 1) })
        if (data.papers.next_token) p.set('next_token', data.papers.next_token)
        goto(`/papers?${p}`)
      }}
    />
  {/if}
</div>

<ConfirmDialog
  open={!!deleteTarget}
  title="Delete paper?"
  message="This action cannot be undone."
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
  .header-left { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .header-actions { display: flex; gap: 8px; flex-shrink: 0; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }

  .filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  /* Desktop table */
  .desktop-only { display: block; }
  .mobile-only  { display: none; }

  @media (max-width: 1019px) {
    .desktop-only { display: none; }
    .mobile-only  { display: flex; flex-direction: column; gap: 12px; }
  }

  .table-wrapper { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; overflow: hidden; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-surface-3); background: var(--color-surface-1); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--color-surface-2); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--color-surface-1); }

  .title-cell { max-width: 280px; }
  .journal-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .date-cell { white-space: nowrap; color: var(--color-text-secondary); font-size: 0.8125rem; }
  .paper-link { color: var(--color-text-primary); text-decoration: none; font-weight: 500; }
  .paper-link:hover { color: var(--color-primary); }
  .actions-col { width: 1%; }
  .actions-cell { display: flex; align-items: center; gap: 2px; }

  /* Mobile cards */
  .paper-card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 14px 16px; cursor: pointer;
    transition: background var(--transition-standard);
  }
  .paper-card:hover { background: var(--color-surface-1); }
  .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .card-title { font-size: 0.9375rem; font-weight: 500; line-height: 1.4; flex: 1; }
  .card-meta { font-size: 0.8125rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
  .card-journal { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
  .dot { color: var(--color-text-disabled); }
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
</style>
