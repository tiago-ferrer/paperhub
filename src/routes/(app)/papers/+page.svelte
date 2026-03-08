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
    <Button onclick={() => goto('/papers/new')}><Plus size={16} /> New Paper</Button>
  </div>

  <div class="filters">
    {#each (['all', 'owner', 'shared'] as Filter[]) as f}
      <button class="filter-chip" class:active={filter === f} onclick={() => filter = f}>
        {f === 'all' ? 'All' : f === 'owner' ? 'Owner' : 'Shared with me'}
      </button>
    {/each}
  </div>

  {#if filtered.length === 0}
    <EmptyState title="No papers found" message="Create your first paper to get started.">
      {#snippet actions()}
        <Button onclick={() => goto('/papers/new')}><Plus size={16} /> New Paper</Button>
      {/snippet}
    </EmptyState>
  {:else}
    <div class="table-wrapper">
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
                  <Eye size={16} />
                </button>
                {#if paper.role === 'OWNER'}
                  <button class="icon-btn" title="Edit" onclick={() => goto(`/papers/${paper.id}/edit`)}>
                    <Pencil size={16} />
                  </button>
                  <button class="icon-btn" title="Viewers" onclick={() => goto(`/papers/${paper.id}/viewers`)}>
                    <Users size={16} />
                  </button>
                  <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = paper}>
                    <Trash2 size={16} />
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
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
  .page { max-width: 1200px; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .page-header h1 { margin: 0; font-size: 28px; font-weight: 400; }

  .filters { display: flex; gap: 8px; margin-bottom: 20px; }
  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 13px; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  .table-wrapper { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; overflow: hidden; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 500; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-surface-3); background: var(--color-surface-1); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--color-surface-2); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--color-surface-1); }

  .title-cell { max-width: 280px; }
  .journal-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .date-cell { white-space: nowrap; color: var(--color-text-secondary); font-size: 13px; }
  .paper-link { color: var(--color-text-primary); text-decoration: none; font-weight: 500; }
  .paper-link:hover { color: var(--color-primary); }

  .actions-col { width: 1%; }
  .actions-cell { display: flex; align-items: center; gap: 2px; }
  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }
</style>
