<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { folders } from '$lib/stores/folders'
  import type { Reference } from '$lib/types/reference'
  import type { ReferenceFolder } from '$lib/types/folder'
  import Button from '$lib/components/ui/Button.svelte'
  import StatusChip from '$lib/components/ui/StatusChip.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import FolderTree from '$lib/components/references/FolderTree.svelte'
  import FromBibTexModal from '$lib/components/references/FromBibTexModal.svelte'
  import ImportBibModal from '$lib/components/references/ImportBibModal.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Eye, Pencil, Trash2, Users, BookMarked, Columns3, FileUp, FolderOpen, FolderX } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  // Sync server-loaded folder tree into the store on every navigation
  $effect(() => { folders.restore(data.folderTree) })

  // ── Column picker ──────────────────────────────────────────────────────────
  const COLUMNS = [
    { key: 'type',    label: 'Type' },
    { key: 'authors', label: 'Authors' },
    { key: 'year',    label: 'Year' },
    { key: 'venue',   label: 'Venue' },
    { key: 'role',    label: 'Role' },
    { key: 'updated', label: 'Updated' },
  ] as const
  type ColKey = typeof COLUMNS[number]['key']

  const LS_KEY  = 'references:columns'
  const ALL_KEYS = COLUMNS.map(c => c.key) as ColKey[]

  function loadCols(): Set<ColKey> {
    if (typeof localStorage === 'undefined') return new Set(ALL_KEYS)
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const arr = JSON.parse(raw) as ColKey[]
        const valid = arr.filter(k => ALL_KEYS.includes(k))
        if (valid.length) return new Set(valid)
      }
    } catch { /* ignore */ }
    return new Set(ALL_KEYS)
  }

  let visibleCols  = $state<Set<ColKey>>(loadCols())
  let showColPicker = $state(false)

  function toggleCol(key: ColKey) {
    const next = new Set(visibleCols)
    if (next.has(key)) { next.delete(key) } else { next.add(key) }
    visibleCols = next
    try { localStorage.setItem(LS_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
  }

  const col = $derived((key: ColKey) => visibleCols.has(key))

  // ── Folder navigation ──────────────────────────────────────────────────────

  function folderPath(id: string, tree: ReferenceFolder[]): string[] {
    for (const f of tree) {
      if (f.id === id) return [f.name]
      const child = folderPath(id, f.children)
      if (child.length) return [f.name, ...child]
    }
    return []
  }

  const activeFolderName = $derived.by(() => {
    if (!data.folderId || data.folderId === 'unfiled') return null
    return folderPath(data.folderId, $folders).join(' › ') || null
  })

  function onFolderSelect(id: string | null) {
    if (!id)              goto('/references')
    else if (id === 'unfiled') goto('/references?folderId=unfiled')
    else                  goto(`/references?folderId=${id}`)
  }

  // ── Filters (only used when no folder active) ──────────────────────────────
  type Filter = 'all' | 'owner' | 'shared'
  let filter = $state<Filter>('all')

  const filtered = $derived.by(() => {
    const items = data.references.items
    if (data.folderId) return items          // server already scoped to OWNER
    if (filter === 'owner')  return items.filter(p => p.role === 'OWNER')
    if (filter === 'shared') return items.filter(p => p.role === 'VIEWER')
    return items
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  let deleteTarget = $state<Reference | null>(null)
  let deleting     = $state(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleting = true
    deleteTarget = null
    try {
      await referencesApi.remove(target.id)
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

  async function undoDelete(reference: Reference, toastId: string) {
    toast.dismiss(toastId)
    try {
      await referencesApi.restore(reference.id)
      toast.success(`"${reference.title}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this reference.')
    }
  }

  // ── Folder assignment ──────────────────────────────────────────────────────
  let folderPickerId   = $state<string | null>(null)
  let assigningRefId   = $state<string | null>(null)

  async function assignFolder(refId: string, folderId: string | null) {
    folderPickerId = null
    assigningRefId = refId
    try {
      await referencesApi.assignFolder(refId, folderId)
      await invalidateAll()
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        toast.error('Only the owner can organize references.')
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Failed to assign folder')
      }
    } finally {
      assigningRefId = null
    }
  }

  async function removeFromFolder(refId: string) {
    await assignFolder(refId, null)
  }

  // Close folder picker when clicking outside
  function onWindowClick(e: MouseEvent) {
    if (folderPickerId && !(e.target as HTMLElement).closest('.folder-pick-wrap')) {
      folderPickerId = null
    }
    if (showColPicker && !(e.target as HTMLElement).closest('.col-picker-wrap')) {
      showColPicker = false
    }
  }

  // ── Drag references ────────────────────────────────────────────────────────
  function onRefDragStart(e: DragEvent, refId: string) {
    e.dataTransfer!.setData('application/x-reference-id', refId)
    e.dataTransfer!.effectAllowed = 'move'
  }

  // Called by FolderTree after a successful drop
  async function onRefMoved(_refId: string, _folderId: string) {
    await invalidateAll()
  }

  // ── Modals ────────────────────────────────────────────────────────────────
  let showFromBibTex = $state(false)
  let showImportBib  = $state(false)

  // Venue: journal > booktitle > publisher > —
  function venue(r: Reference): string {
    return r.journal ?? r.booktitle ?? r.publisher ?? '—'
  }

  // ── Empty state message ────────────────────────────────────────────────────
  const emptyTitle = $derived.by(() => {
    if (data.folderId === 'unfiled') return 'All references are organized'
    if (data.folderId)               return 'This folder is empty'
    return 'No references found'
  })
  const emptyMessage = $derived.by(() => {
    if (data.folderId === 'unfiled') return 'All your references are organized in folders.'
    if (data.folderId)               return 'Drag references here or use the assign button on a reference row.'
    return 'Create your first reference to get started.'
  })
</script>

<svelte:window onclick={onWindowClick} />

<div class="page">
  <div class="page-header">
    <h1>References</h1>
    <div class="header-actions">
      <Button variant="outlined" onclick={() => showImportBib = true}><FileUp size={18} /> Import .bib</Button>
      <Button variant="outlined" onclick={() => showFromBibTex = true}><BookMarked size={18} /> From BibTeX</Button>
      <Button onclick={() => goto('/references/new')}><Plus size={20} /> New Reference</Button>
    </div>
  </div>

  <div class="body">
    <!-- Folder sidebar -->
    <aside class="folder-sidebar">
      <FolderTree
        activeId={data.folderId}
        onselect={onFolderSelect}
        onrefmoved={onRefMoved}
      />
    </aside>

    <!-- Main content -->
    <div class="content">
      <!-- Breadcrumb -->
      {#if activeFolderName}
        <p class="breadcrumb">📁 {activeFolderName}</p>
      {:else if data.folderId === 'unfiled'}
        <p class="breadcrumb">Unfiled references</p>
      {/if}

      <!-- Toolbar -->
      <div class="toolbar">
        {#if !data.folderId}
          <div class="filters">
            {#each (['all', 'owner', 'shared'] as Filter[]) as f}
              <button class="filter-chip" class:active={filter === f} onclick={() => filter = f}>
                {f === 'all' ? 'All' : f === 'owner' ? 'Owner' : 'Shared with me'}
              </button>
            {/each}
          </div>
        {:else}
          <div></div>
        {/if}

        <!-- Column picker -->
        <div class="col-picker-wrap desktop-only">
          <button
            class="col-picker-btn"
            class:active={showColPicker}
            onclick={() => showColPicker = !showColPicker}
            title="Choose columns"
          >
            <Columns3 size={16} />
            Columns
          </button>
          {#if showColPicker}
            <div class="col-picker-dropdown">
              {#each COLUMNS as c}
                <label class="col-option">
                  <input type="checkbox" checked={visibleCols.has(c.key)} onchange={() => toggleCol(c.key)} />
                  {c.label}
                </label>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      {#if filtered.length === 0}
        <EmptyState title={emptyTitle} message={emptyMessage} />
      {:else}
        <!-- Desktop table -->
        <div class="table-wrapper desktop-only">
          <table class="data-table">
            <thead>
              <tr>
                <th>Title</th>
                {#if col('type')}<th>Type</th>{/if}
                {#if col('authors')}<th>Authors</th>{/if}
                {#if col('year')}<th>Year</th>{/if}
                {#if col('venue')}<th>Venue</th>{/if}
                {#if col('role')}<th>Role</th>{/if}
                {#if col('updated')}<th>Updated</th>{/if}
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filtered as reference (reference.id)}
                <tr
                  draggable="true"
                  ondragstart={(e) => onRefDragStart(e, reference.id)}
                  class:dragging={assigningRefId === reference.id}
                >
                  <td class="title-cell"><a href="/references/{reference.id}" class="paper-link">{reference.title}</a></td>
                  {#if col('type')}<td><span class="entry-badge">{reference.entry_type}</span></td>{/if}
                  {#if col('authors')}<td class="authors-cell">{reference.author?.join(', ') ?? '—'}</td>{/if}
                  {#if col('year')}<td>{reference.year ?? '—'}</td>{/if}
                  {#if col('venue')}<td class="journal-cell">{venue(reference)}</td>{/if}
                  {#if col('role')}<td><StatusChip label={reference.role} variant={reference.role === 'OWNER' ? 'info' : 'neutral'} /></td>{/if}
                  {#if col('updated')}<td class="date-cell">{formatDate(reference.updated_at)}</td>{/if}
                  <td class="actions-cell">
                    <button class="icon-btn" title="View" onclick={() => goto(`/references/${reference.id}`)}>
                      <Eye size={20} />
                    </button>
                    {#if reference.role === 'OWNER'}
                      <button class="icon-btn" title="Edit" onclick={() => goto(`/references/${reference.id}/edit`)}>
                        <Pencil size={20} />
                      </button>
                      <button class="icon-btn" title="Viewers" onclick={() => goto(`/references/${reference.id}/viewers`)}>
                        <Users size={20} />
                      </button>

                      <!-- Folder assign -->
                      <div class="folder-pick-wrap">
                        <button
                          class="icon-btn"
                          title="Assign to folder"
                          onclick={(e) => { e.stopPropagation(); folderPickerId = folderPickerId === reference.id ? null : reference.id }}
                        >
                          <FolderOpen size={20} />
                        </button>
                        {#if folderPickerId === reference.id}
                          <div class="folder-picker">
                            <button class="fp-item fp-unfiled" onclick={() => assignFolder(reference.id, null)}>
                              Unfiled
                            </button>
                            {#each folders.flatten() as { folder, depth }}
                              <button
                                class="fp-item"
                                class:fp-active={reference.folder_id === folder.id}
                                style="padding-left: {10 + depth * 12}px"
                                onclick={() => assignFolder(reference.id, folder.id)}
                              >
                                {folder.name}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </div>

                      <!-- Remove from folder (only shown when browsing a folder) -->
                      {#if data.folderId && data.folderId !== 'unfiled' && reference.folder_id === data.folderId}
                        <button class="icon-btn" title="Remove from folder" onclick={() => removeFromFolder(reference.id)}>
                          <FolderX size={20} />
                        </button>
                      {/if}

                      <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = reference}>
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
          {#each filtered as reference (reference.id)}
            <div
              class="paper-card"
              draggable="true"
              ondragstart={(e) => onRefDragStart(e, reference.id)}
              onclick={() => goto(`/references/${reference.id}`)}
            >
              <div class="card-top">
                <a href="/references/{reference.id}" class="paper-link card-title">{reference.title}</a>
                <div class="card-badges">
                  <span class="entry-badge">{reference.entry_type}</span>
                  <StatusChip label={reference.role} variant={reference.role === 'OWNER' ? 'info' : 'neutral'} />
                </div>
              </div>
              <div class="card-meta">
                {#if reference.author?.length}
                  <span class="card-authors">{reference.author[0]}{reference.author.length > 1 ? ' et al.' : ''}</span>
                  <span class="dot">·</span>
                {/if}
                <span>{reference.year ?? '—'}</span>
                <span class="dot">·</span>
                <span class="card-journal">{venue(reference)}</span>
              </div>
              <div class="card-footer">
                <span class="card-date">{formatDate(reference.updated_at)}</span>
                <div class="card-actions" onclick={(e) => e.stopPropagation()}>
                  {#if reference.role === 'OWNER'}
                    <button class="icon-btn" title="Edit" onclick={() => goto(`/references/${reference.id}/edit`)}>
                      <Pencil size={20} />
                    </button>
                    {#if data.folderId && data.folderId !== 'unfiled' && reference.folder_id === data.folderId}
                      <button class="icon-btn" title="Remove from folder" onclick={() => removeFromFolder(reference.id)}>
                        <FolderX size={20} />
                      </button>
                    {/if}
                    <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = reference}>
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
          hasNext={!!data.references.next_token}
          nextToken={data.references.next_token}
          onprev={() => {
            const p = new URLSearchParams({ page: String(Math.max(0, data.page - 1)) })
            if (data.folderId) p.set('folderId', data.folderId)
            goto(`/references?${p}`)
          }}
          onnext={() => {
            const p = new URLSearchParams({ page: String(data.page + 1) })
            if (data.references.next_token) p.set('next_token', data.references.next_token)
            if (data.folderId) p.set('folderId', data.folderId)
            goto(`/references?${p}`)
          }}
        />
      {/if}
    </div>
  </div>
</div>

<ImportBibModal
  open={showImportBib}
  initialFolderId={data.folderId && data.folderId !== 'unfiled' ? data.folderId : null}
  onclose={() => showImportBib = false}
/>
<FromBibTexModal open={showFromBibTex} onclose={() => showFromBibTex = false} />

<DestructiveConfirmDialog
  open={!!deleteTarget}
  title="Delete reference?"
  message="This reference will be permanently deleted in 7 days."
  confirmPhrase={`I want to delete ${deleteTarget?.title ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .header-actions { display: flex; align-items: center; gap: 8px; }

  /* Two-column body */
  .body { display: flex; gap: 16px; align-items: flex-start; }

  .folder-sidebar {
    width: 220px; flex-shrink: 0;
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; height: calc(100vh - 160px);
    position: sticky; top: 80px; overflow: hidden;
    display: flex; flex-direction: column;
  }

  .content { flex: 1; min-width: 0; }

  .breadcrumb {
    font-size: 0.8125rem; color: var(--color-text-secondary);
    margin: 0 0 12px; padding: 0;
  }

  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .filters { display: flex; gap: 8px; flex-wrap: wrap; }
  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  /* Column picker */
  .col-picker-wrap { position: relative; }
  .col-picker-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 8px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .col-picker-btn:hover, .col-picker-btn.active { background: var(--color-surface-2); color: var(--color-text-primary); }
  .col-picker-dropdown {
    position: absolute; right: 0; top: calc(100% + 6px); z-index: 30;
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; box-shadow: var(--shadow-2);
    padding: 8px; display: flex; flex-direction: column; gap: 2px; min-width: 160px;
  }
  .col-option {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 10px; border-radius: 6px; cursor: pointer;
    font-size: 0.875rem; color: var(--color-text-primary);
    transition: background var(--transition-standard);
  }
  .col-option:hover { background: var(--color-surface-2); }
  .col-option input[type="checkbox"] { accent-color: var(--color-primary); width: 15px; height: 15px; cursor: pointer; }

  /* Entry badge */
  .entry-badge {
    display: inline-block; padding: 2px 7px; border-radius: 8px;
    font-size: 0.6875rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.03em;
    background: var(--color-surface-2); color: var(--color-text-secondary); white-space: nowrap;
  }

  /* Desktop/mobile split */
  .desktop-only { display: block; }
  .mobile-only  { display: none; }
  @media (max-width: 1019px) {
    .desktop-only { display: none; }
    .mobile-only  { display: flex; flex-direction: column; gap: 12px; }
    .body { flex-direction: column; }
    .folder-sidebar { width: 100%; height: auto; max-height: 260px; position: static; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .header-actions { width: 100%; justify-content: flex-end; }
  }

  /* Table */
  .table-wrapper { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; overflow: hidden; }
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { text-align: left; padding: 12px 16px; font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-surface-3); background: var(--color-surface-1); }
  td { padding: 12px 16px; border-bottom: 1px solid var(--color-surface-2); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--color-surface-1); }
  tr.dragging { opacity: 0.5; }

  .title-cell { max-width: 260px; }
  .authors-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-text-secondary); font-size: 0.8125rem; }
  .journal-cell { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .date-cell { white-space: nowrap; color: var(--color-text-secondary); font-size: 0.8125rem; }
  .paper-link { color: var(--color-text-primary); text-decoration: none; font-weight: 500; }
  .paper-link:hover { color: var(--color-primary); }
  .actions-col { width: 1%; }
  .actions-cell { display: flex; align-items: center; justify-content: center; gap: 2px; }

  /* Folder picker */
  .folder-pick-wrap { position: relative; }
  .folder-picker {
    position: absolute; right: 0; top: calc(100% + 4px); z-index: 40;
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 8px; box-shadow: var(--shadow-2);
    min-width: 180px; max-height: 220px; overflow-y: auto;
    display: flex; flex-direction: column; padding: 4px;
  }
  .fp-item {
    display: flex; align-items: center; padding: 6px 10px; border-radius: 5px;
    border: none; background: transparent; cursor: pointer; text-align: left;
    font-size: 0.8125rem; color: var(--color-text-primary); white-space: nowrap;
    transition: background var(--transition-standard);
  }
  .fp-item:hover { background: var(--color-surface-2); }
  .fp-item.fp-active { color: var(--color-primary); font-weight: 500; }
  .fp-item.fp-unfiled { color: var(--color-text-secondary); border-bottom: 1px solid var(--color-surface-2); margin-bottom: 4px; }

  /* Mobile cards */
  .paper-card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 14px 16px; cursor: pointer;
    transition: background var(--transition-standard);
  }
  .paper-card:hover { background: var(--color-surface-1); }
  .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .card-title { font-size: 0.9375rem; font-weight: 500; line-height: 1.4; flex: 1; }
  .card-badges { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .card-meta { font-size: 0.8125rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
  .card-authors { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-journal { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
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
