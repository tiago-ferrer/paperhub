<script module>
  // Shared across all FolderNode instances during a single drag gesture
  let draggingFolderId: string | null = null
</script>

<script lang="ts">
  import FolderNode from './FolderNode.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import { folders } from '$lib/stores/folders'
  import { foldersApi } from '$lib/api/folders'
  import { toast } from '$lib/stores/toast'
  import { ApiError } from '$lib/api/client'
  import type { ReferenceFolder } from '$lib/types/folder'
  import { ChevronRight, Folder, FolderOpen, Plus, Pencil, Trash2 } from 'lucide-svelte'

  interface Props {
    folder:       ReferenceFolder
    activeId:     string | null
    onselect:     (id: string) => void
    ondropref:    (refId: string, folderId: string) => void
    ondropfolder: (srcId: string, targetId: string | null) => void
    ondelete:     (id: string) => void
  }
  let { folder, activeId, onselect, ondropref, ondropfolder, ondelete }: Props = $props()

  let expanded       = $state(folder.children.length > 0)
  let renaming       = $state(false)
  let renameDraft    = $state('')
  let creatingChild  = $state(false)
  let newChildName   = $state('')
  let dragOver       = $state(false)
  let showConfirm    = $state(false)

  // ── Rename ────────────────────────────────────────────────────────────────

  function startRename() {
    renameDraft = folder.name
    renaming = true
  }

  async function submitRename() {
    const name = renameDraft.trim()
    if (!name) { toast.error('Folder name cannot be empty'); renaming = false; return }
    if (name === folder.name) { renaming = false; return }
    renaming = false
    const snap = folders.snapshot()
    folders.renameFolder(folder.id, name)
    try {
      await foldersApi.rename(folder.id, { name })
    } catch (e) {
      folders.restore(snap)
      toast.error(e instanceof ApiError ? e.message : 'Failed to rename folder')
    }
  }

  function onRenameKey(e: KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); submitRename() }
    if (e.key === 'Escape') { renaming = false }
  }

  // ── Create child ──────────────────────────────────────────────────────────

  function startCreate() {
    newChildName = ''
    creatingChild = true
    expanded = true
  }

  async function submitCreate() {
    const name = newChildName.trim()
    if (!name) { creatingChild = false; return }
    creatingChild = false
    try {
      const created = await foldersApi.create({ name, parent_id: folder.id })
      folders.addFolder(created)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create folder')
    }
  }

  function onCreateKey(e: KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); submitCreate() }
    if (e.key === 'Escape') { creatingChild = false }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function doDelete() {
    showConfirm = false
    ondelete(folder.id)
    const snap = folders.snapshot()
    folders.removeFolder(folder.id)
    try {
      await foldersApi.remove(folder.id)
    } catch (e) {
      folders.restore(snap)
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete folder')
    }
  }

  // ── Drag-and-drop ─────────────────────────────────────────────────────────

  function isInvalidTarget(srcId: string): boolean {
    return srcId === folder.id || folders.findDescendantIds(srcId).includes(folder.id)
  }

  function onDragStart(e: DragEvent) {
    draggingFolderId = folder.id
    e.dataTransfer!.setData('application/x-folder-id', folder.id)
    e.dataTransfer!.effectAllowed = 'move'
  }

  function onDragEnd() {
    draggingFolderId = null
    dragOver = false
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (draggingFolderId && isInvalidTarget(draggingFolderId)) {
      e.dataTransfer!.dropEffect = 'none'
      return
    }
    dragOver = true
    e.dataTransfer!.dropEffect = 'move'
  }

  function onDragLeave(e: DragEvent) {
    // Only clear if leaving the node itself, not a child element
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      dragOver = false
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragOver = false
    const srcFolderId = e.dataTransfer?.getData('application/x-folder-id')
    const srcRefId    = e.dataTransfer?.getData('application/x-reference-id')
    if (srcFolderId) {
      if (isInvalidTarget(srcFolderId)) return
      ondropfolder(srcFolderId, folder.id)
    } else if (srcRefId) {
      ondropref(srcRefId, folder.id)
    }
  }
</script>

<div class="node-wrap">
  <!-- Node row -->
  <div
    class="node"
    class:active={activeId === folder.id}
    class:drag-over={dragOver}
    role="treeitem"
    aria-expanded={expanded}
    draggable="true"
    ondragstart={onDragStart}
    ondragend={onDragEnd}
    ondragover={onDragOver}
    ondragleave={onDragLeave}
    ondrop={onDrop}
  >
    <button
      class="chevron"
      onclick={(e) => { e.stopPropagation(); expanded = !expanded }}
      tabindex="-1"
      aria-label={expanded ? 'Collapse' : 'Expand'}
    >
      {#if folder.children.length > 0 || creatingChild}
        <ChevronRight size={13} class={expanded ? 'rot' : ''} />
      {:else}
        <span class="chevron-gap"></span>
      {/if}
    </button>

    <span class="folder-icon">
      {#if expanded}
        <FolderOpen size={15} />
      {:else}
        <Folder size={15} />
      {/if}
    </span>

    {#if renaming}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="inline-input"
        bind:value={renameDraft}
        onkeydown={onRenameKey}
        autofocus
      />
    {:else}
      <button class="node-label" onclick={() => onselect(folder.id)}>
        {folder.name}
      </button>
    {/if}

    <div class="node-actions">
      <button class="act-btn" onclick={(e) => { e.stopPropagation(); startCreate() }}  title="New subfolder"><Plus  size={13} /></button>
      <button class="act-btn" onclick={(e) => { e.stopPropagation(); startRename() }}  title="Rename"><Pencil size={13} /></button>
      <button class="act-btn danger" onclick={(e) => { e.stopPropagation(); showConfirm = true }} title="Delete"><Trash2 size={13} /></button>
    </div>
  </div>

  <!-- Children -->
  {#if expanded}
    <div class="children">
      {#each folder.children as child (child.id)}
        <FolderNode
          folder={child}
          {activeId}
          {onselect}
          {ondropref}
          {ondropfolder}
          {ondelete}
        />
      {/each}

      {#if creatingChild}
        <!-- svelte-ignore a11y_autofocus -->
        <div class="new-child-row">
          <span class="chevron-gap"></span>
          <Folder size={15} class="folder-icon-sm" />
          <input
            class="inline-input"
            bind:value={newChildName}
            placeholder="Folder name…"
            onkeydown={onCreateKey}
            autofocus
          />
        </div>
      {/if}
    </div>
  {/if}
</div>

<ConfirmDialog
  open={showConfirm}
  title={`Delete "${folder.name}"?`}
  message="All subfolders inside will also be deleted. References will not be deleted — they will become unfiled."
  confirmLabel="Delete"
  onconfirm={doDelete}
  oncancel={() => showConfirm = false}
/>

<style>
  .node-wrap { display: flex; flex-direction: column; }

  .node {
    display: flex; align-items: center; gap: 4px;
    padding: 0 6px; height: 32px; border-radius: 6px; cursor: pointer;
    position: relative; user-select: none;
    transition: background var(--transition-standard);
  }
  .node:hover { background: var(--color-surface-2); }
  .node.active { background: var(--color-primary-subtle); }
  .node.drag-over { background: var(--color-primary-subtle); outline: 2px solid var(--color-primary); outline-offset: -2px; }

  .chevron {
    display: flex; align-items: center; justify-content: center;
    width: 16px; height: 16px; flex-shrink: 0;
    border: none; background: transparent; cursor: pointer; padding: 0;
    color: var(--color-text-secondary);
  }
  .chevron-gap { display: inline-block; width: 16px; flex-shrink: 0; }

  .chevron :global(.rot) { transform: rotate(90deg); transition: transform var(--transition-standard); }

  .folder-icon {
    display: flex; align-items: center; flex-shrink: 0;
    color: var(--color-text-secondary);
  }
  .node.active .folder-icon { color: var(--color-primary); }

  .node-label {
    flex: 1; min-width: 0; text-align: left;
    background: transparent; border: none; cursor: pointer; padding: 0;
    font-size: 0.875rem; color: var(--color-text-primary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .node.active .node-label { color: var(--color-primary); font-weight: 500; }

  .inline-input {
    flex: 1; min-width: 0; padding: 2px 6px; border-radius: 4px; font-size: 0.875rem;
    border: 1px solid var(--color-primary); background: var(--color-surface-0);
    color: var(--color-text-primary); outline: none; font-family: inherit;
    box-shadow: 0 0 0 2px var(--color-primary-subtle);
  }

  .node-actions {
    display: none; align-items: center; gap: 1px; flex-shrink: 0; margin-left: 2px;
  }
  .node:hover .node-actions,
  .node.active .node-actions { display: flex; }

  .act-btn {
    display: flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 4px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
    flex-shrink: 0;
  }
  .act-btn:hover { background: var(--color-surface-3); color: var(--color-text-primary); }
  .act-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); }

  .children { padding-left: 16px; }

  .new-child-row {
    display: flex; align-items: center; gap: 4px;
    padding: 0 6px; height: 32px;
  }
  :global(.folder-icon-sm) { color: var(--color-text-secondary); }
</style>
