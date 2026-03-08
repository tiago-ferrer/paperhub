<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'

  interface Column {
    key: string
    label: string
    width?: string
  }

  interface Props {
    columns: Column[]
    rows: T[]
    loading?: boolean
    emptyMessage?: string
    rowActions?: Snippet<[T]>
  }

  let {
    columns,
    rows,
    loading = false,
    emptyMessage = 'No records found',
    rowActions,
  }: Props = $props()
</script>

<div class="table-wrapper">
  <table class="data-table">
    <thead>
      <tr>
        {#each columns as col}
          <th style:width={col.width}>{col.label}</th>
        {/each}
        {#if rowActions}<th class="actions-col">Actions</th>{/if}
      </tr>
    </thead>
    <tbody>
      {#if loading}
        <tr><td colspan={columns.length + (rowActions ? 1 : 0)} class="loading-cell">
          <Spinner size={24} />
        </td></tr>
      {:else if rows.length === 0}
        <tr><td colspan={columns.length + (rowActions ? 1 : 0)} class="empty-cell">
          {emptyMessage}
        </td></tr>
      {:else}
        {#each rows as row}
          <tr>
            {#each columns as col}
              <td>{row[col.key] ?? '—'}</td>
            {/each}
            {#if rowActions}
              <td class="actions-cell">{@render rowActions(row)}</td>
            {/if}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-wrapper { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th {
    text-align: left; padding: 10px 16px;
    font-size: 12px; font-weight: 500; color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-surface-3);
    white-space: nowrap;
  }
  td {
    padding: 12px 16px; border-bottom: 1px solid var(--color-surface-2);
    color: var(--color-text-primary);
  }
  tr:hover td { background: var(--color-surface-1); }
  .loading-cell, .empty-cell {
    text-align: center; padding: 40px;
    color: var(--color-text-secondary);
  }
  .loading-cell { display: table-cell; }
  .actions-col, .actions-cell { width: 1%; white-space: nowrap; }
  .actions-cell { display: flex; align-items: center; gap: 4px; }
</style>
