<script lang="ts">
  import { onMount } from 'svelte'
  import { folders } from '$lib/stores/folders'
  import { foldersApi } from '$lib/api/folders'
  import { referencesApi } from '$lib/api/references'
  import { toast } from '$lib/stores/toast'
  import { ApiError } from '$lib/api/client'
  import FolderNode from './FolderNode.svelte'
  import { FolderPlus, Layers, Inbox } from 'lucide-svelte'

  interface Props {
    /** null = All References, 'unfiled' = Unfiled, uuid = specific folder */
    activeId:  string | null
    onselect:  (id: string | null) => void
    /** Called after a reference is successfully dropped onto a folder. */
    onrefmoved?: (refId: string, folderId: string) => void
  }
  let { activeId, onselect, onrefmoved }: Props = $props()

  let creatingRoot  = $state(false)
  let newRootName   = $state('')
  let rootDragOver  = $state(false)

  onMount(() => {
    if ($folders.length === 0) folders.load()
  })

  // ── Root folder create ────────────────────────────────────────────────────

  async function submitRootCreate() {
    const name = newRootName.trim()
    if (!name) { creatingRoot = false; return }
    creatingRoot = false
    try {
      const created = await foldersApi.create({ name })
      folders.addFolder(created)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create folder')
    }
  }

  function onRootCreateKey(e: KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); submitRootCreate() }
    if (e.key === 'Escape') { creatingRoot = false }
  }

  // ── Move folder (from FolderNode or root drop zone) ───────────────────────

  async function handleDropFolder(srcId: string, targetId: string | null) {
    const snap = folders.snapshot()
    folders.moveFolder(srcId, targetId)
    try {
      await foldersApi.move(srcId, { parent_id: targetId })
    } catch (e) {
      folders.restore(snap)
      if (e instanceof ApiError && e.status === 400) {
        toast.error('Cannot move a folder into one of its own subfolders.')
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Failed to move folder')
      }
    }
  }

  // ── Assign reference to folder (drop from list) ───────────────────────────

  async function handleDropRef(refId: string, folderId: string) {
    try {
      await referencesApi.assignFolder(refId, folderId)
      toast.success('Reference moved to folder')
      onrefmoved?.(refId, folderId)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        toast.error('Only the owner can organize references.')
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Failed to assign reference')
      }
    }
  }

  // ── Folder deleted: reset active if it was the deleted folder/descendant ──

  function handleNodeDelete(deletedId: string) {
    if (!activeId || activeId === 'unfiled') return
    const desc = folders.findDescendantIds(deletedId)
    if (activeId === deletedId || desc.includes(activeId)) {
      onselect(null)
    }
  }

  // ── Root drop zone (move folder to root level) ────────────────────────────

  function onRootDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer?.types.includes('application/x-folder-id')) {
      rootDragOver = true
      e.dataTransfer.dropEffect = 'move'
    }
  }
  function onRootDragLeave() { rootDragOver = false }
  function onRootDrop(e: DragEvent) {
    e.preventDefault()
    rootDragOver = false
    const srcId = e.dataTransfer?.getData('application/x-folder-id')
    if (srcId) handleDropFolder(srcId, null)
  }
</script>

<nav class="tree" aria-label="Reference folders">
  <!-- All References -->
  <button
    class="fixed-entry"
    class:active={activeId === null}
    onclick={() => onselect(null)}
  >
    <Layers size={15} />
    <span>All References</span>
  </button>

  <!-- Folder tree -->
  <div class="folder-section">
    <div class="section-header">
      <span class="section-label">Folders</span>
      <button
        class="new-folder-btn"
        onclick={() => { newRootName = ''; creatingRoot = true }}
        title="New folder"
      >
        <FolderPlus size={14} />
      </button>
    </div>

    {#if $folders.length === 0 && !creatingRoot}
      <p class="empty-msg">No folders yet</p>
    {:else}
      <div
        class="root-drop-zone"
        class:drag-over={rootDragOver}
        role="presentation"
        ondragover={onRootDragOver}
        ondragleave={onRootDragLeave}
        ondrop={onRootDrop}
      >
        {#each $folders as folder (folder.id)}
          <FolderNode
            {folder}
            {activeId}
            onselect={(id) => onselect(id)}
            ondropref={handleDropRef}
            ondropfolder={handleDropFolder}
            ondelete={handleNodeDelete}
          />
        {/each}
      </div>
    {/if}

    {#if creatingRoot}
      <!-- svelte-ignore a11y_autofocus -->
      <div class="new-root-row">
        <input
          class="inline-input"
          bind:value={newRootName}
          placeholder="Folder name…"
          onkeydown={onRootCreateKey}
          autofocus
        />
      </div>
    {/if}
  </div>

  <!-- Unfiled -->
  <button
    class="fixed-entry"
    class:active={activeId === 'unfiled'}
    onclick={() => onselect('unfiled')}
  >
    <Inbox size={15} />
    <span>Unfiled</span>
  </button>
</nav>

<style>
  .tree {
    display: flex; flex-direction: column; gap: 2px;
    padding: 8px 6px;
    height: 100%; overflow-y: auto;
  }

  .fixed-entry {
    display: flex; align-items: center; gap: 8px;
    padding: 0 8px; height: 32px; border-radius: 6px;
    border: none; background: transparent; cursor: pointer; width: 100%;
    text-align: left; font-size: 0.875rem; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
    flex-shrink: 0;
  }
  .fixed-entry:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .fixed-entry.active {
    background: var(--color-primary-subtle);
    color: var(--color-primary);
    font-weight: 500;
  }

  .folder-section { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow-y: auto; }

  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 8px 4px; flex-shrink: 0;
  }
  .section-label {
    font-size: 0.6875rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--color-text-disabled);
  }
  .new-folder-btn {
    display: flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 4px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .new-folder-btn:hover { background: var(--color-surface-3); color: var(--color-text-primary); }

  .empty-msg {
    font-size: 0.8125rem; color: var(--color-text-disabled);
    padding: 4px 8px; margin: 0;
  }

  .root-drop-zone {
    border-radius: 6px; min-height: 4px;
    transition: background var(--transition-standard);
  }
  .root-drop-zone.drag-over { background: var(--color-primary-subtle); outline: 2px dashed var(--color-primary); outline-offset: -2px; }

  .new-root-row {
    padding: 4px 6px;
  }
  .inline-input {
    width: 100%; padding: 4px 8px; border-radius: 6px; font-size: 0.875rem;
    border: 1px solid var(--color-primary); background: var(--color-surface-0);
    color: var(--color-text-primary); outline: none; font-family: inherit;
    box-sizing: border-box; box-shadow: 0 0 0 2px var(--color-primary-subtle);
  }
</style>
