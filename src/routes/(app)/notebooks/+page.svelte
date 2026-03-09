<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { notebooksApi } from '$lib/api/notebooks'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Notebook } from '$lib/types/notebook'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Pencil, Trash2, BookOpen } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let deleteTarget = $state<Notebook | null>(null)
  let deleting = $state(false)

  function toggleDeleted() {
    const params = new URLSearchParams()
    if (!data.includeDeleted) params.set('includeDeleted', 'true')
    goto(`/notebooks?${params}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    deleting = true
    try {
      await notebooksApi.remove(deleteTarget.id)
      toast.success('Notebook deleted')
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
    <h1>Notebooks</h1>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>
        Show deleted
      </button>
      <Button onclick={() => goto('/notebooks/new')}><Plus size={20} /> New Notebook</Button>
    </div>
  </div>

  {#if data.notebooks.items.length === 0}
    <EmptyState title="No notebooks yet" message="Create your first notebook to start writing." />
  {:else}
    <!-- Desktop table -->
    <div class="table-wrapper desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Updated</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.notebooks.items as nb}
            <tr class:deleted-row={nb.deleted}>
              <td class="title-cell">
                <a href="/notebooks/{nb.id}" class="nb-link" class:deleted-text={nb.deleted}>{nb.title}</a>
                {#if nb.deleted}<span class="deleted-badge">deleted</span>{/if}
              </td>
              <td class="desc-cell">{nb.description ?? ''}</td>
              <td class="date-cell">{formatDate(nb.updated_at)}</td>
              <td class="actions-cell">
                <button class="icon-btn" title="Open" onclick={() => goto(`/notebooks/${nb.id}`)}>
                  <BookOpen size={20} />
                </button>
                {#if !nb.deleted}
                  <button class="icon-btn" title="Edit" onclick={() => goto(`/notebooks/${nb.id}/edit`)}>
                    <Pencil size={20} />
                  </button>
                  <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = nb}>
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
      {#each data.notebooks.items as nb}
        <div class="nb-card" class:deleted-card={nb.deleted} onclick={() => goto(`/notebooks/${nb.id}`)}>
          <div class="card-top">
            <span class="card-title" class:deleted-text={nb.deleted}>{nb.title}</span>
            {#if nb.deleted}<span class="deleted-badge">deleted</span>{/if}
          </div>
          {#if nb.description}
            <p class="card-desc">{nb.description}</p>
          {/if}
          <div class="card-footer">
            <span class="card-date">{formatDate(nb.updated_at)}</span>
            <div class="card-actions" onclick={(e) => e.stopPropagation()}>
              {#if !nb.deleted}
                <button class="icon-btn" title="Edit" onclick={() => goto(`/notebooks/${nb.id}/edit`)}>
                  <Pencil size={20} />
                </button>
                <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = nb}>
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
      hasNext={!!data.notebooks.next_token}
      nextToken={data.notebooks.next_token}
      onprev={() => {
        const p = new URLSearchParams({ page: String(Math.max(0, data.page - 1)) })
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/notebooks?${p}`)
      }}
      onnext={() => {
        const p = new URLSearchParams({ page: String(data.page + 1) })
        if (data.notebooks.next_token) p.set('next_token', data.notebooks.next_token)
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/notebooks?${p}`)
      }}
    />
  {/if}
</div>

<ConfirmDialog
  open={!!deleteTarget}
  title="Delete notebook?"
  message="This notebook and all its posts will be soft-deleted."
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

  .title-cell { max-width: 240px; }
  .desc-cell { max-width: 300px; color: var(--color-text-secondary); font-size: 0.8125rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .date-cell { white-space: nowrap; color: var(--color-text-secondary); font-size: 0.8125rem; }
  .nb-link { color: var(--color-text-primary); text-decoration: none; font-weight: 500; }
  .nb-link:hover { color: var(--color-primary); }
  .actions-col { width: 1%; }
  .actions-cell { display: flex; align-items: center; gap: 2px; }

  .deleted-row td { opacity: 0.55; }
  .deleted-text { text-decoration: line-through; color: var(--color-text-disabled); }
  .deleted-badge {
    display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 10px;
    font-size: 0.6875rem; background: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error); font-weight: 500; vertical-align: middle;
  }

  .nb-card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 14px 16px; cursor: pointer;
    transition: background var(--transition-standard);
  }
  .nb-card:hover { background: var(--color-surface-1); }
  .deleted-card { opacity: 0.6; }
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
</style>
