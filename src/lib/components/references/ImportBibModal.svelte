<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { scale, fade } from 'svelte/transition'
  import { referencesApi } from '$lib/api/references'
  import { folders } from '$lib/stores/folders'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { BibImportResult } from '$lib/types/reference'
  import Button from '$lib/components/ui/Button.svelte'
  import { X, Upload, CheckCircle, SkipForward } from 'lucide-svelte'

  interface Props {
    open?: boolean
    onclose?: () => void
    /** Pre-select this folder when the modal opens (e.g. when a folder is active in the sidebar). */
    initialFolderId?: string | null
  }
  let { open = false, onclose, initialFolderId = null }: Props = $props()

  type Phase = 'upload' | 'done'

  let phase            = $state<Phase>('upload')
  let file             = $state<File | null>(null)
  let uploading        = $state(false)
  let result           = $state<BibImportResult | null>(null)
  let dragOver         = $state(false)
  let fileInput        = $state<HTMLInputElement | undefined>(undefined)
  let selectedFolderId = $state<string | null>(initialFolderId)
  let folderError      = $state<string | null>(null)

  // Re-sync when the prop changes (e.g. user navigates to a different folder)
  $effect(() => { selectedFolderId = initialFolderId })

  const selectedFolderName = $derived.by(() => {
    if (!selectedFolderId) return null
    return folders.find(selectedFolderId)?.name ?? null
  })

  const MAX_BYTES = 10 * 1024 * 1024

  function pickFile(f: File) {
    if (!f.name.endsWith('.bib')) {
      toast.error('Please select a .bib file.')
      return
    }
    if (f.size > MAX_BYTES) {
      toast.error('File too large. Maximum size is 10 MB.')
      return
    }
    file = f
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    dragOver = false
    const f = e.dataTransfer?.files[0]
    if (f) pickFile(f)
  }

  function onInputChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0]
    if (f) pickFile(f)
  }

  async function doImport() {
    if (!file) return
    folderError = null
    uploading = true
    try {
      result = await referencesApi.importBib(file, selectedFolderId ?? undefined)
      phase = 'done'
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        folderError = 'The selected folder no longer exists. Please choose another.'
        selectedFolderId = null
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Import failed. Please try again.')
        reset()
        onclose?.()
      }
    } finally {
      uploading = false
    }
  }

  async function done() {
    if (result && result.added > 0) await invalidateAll()
    reset()
    onclose?.()
  }

  function importAnother() {
    file = null
    result = null
    phase = 'upload'
    folderError = null
    selectedFolderId = initialFolderId
    if (fileInput) fileInput.value = ''
  }

  function reset() {
    file = null
    result = null
    phase = 'upload'
    folderError = null
    selectedFolderId = initialFolderId
    if (fileInput) fileInput.value = ''
  }

  function handleClose() {
    reset()
    onclose?.()
  }
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div
      class="modal"
      transition:scale={{ start: 0.96, duration: 150 }}
      role="dialog"
      aria-modal="true"
      aria-label="Import .bib file"
    >
      <div class="modal-header">
        <h3>Import .bib file</h3>
        <button class="close-btn" onclick={handleClose} aria-label="Close"><X size={22} /></button>
      </div>

      <div class="modal-body">
        {#if phase === 'upload'}
          <!-- Drop zone -->
          <div
            class="drop-zone"
            class:drag-over={dragOver}
            role="button"
            tabindex="0"
            onclick={() => fileInput?.click()}
            onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
            ondragover={(e) => { e.preventDefault(); dragOver = true }}
            ondragleave={() => dragOver = false}
            ondrop={onDrop}
          >
            <Upload size={32} class="drop-icon" />
            {#if file}
              <p class="filename">{file.name}</p>
              <p class="drop-hint">Click or drop to replace</p>
            {:else}
              <p class="drop-label">Drop a .bib file here</p>
              <p class="drop-hint">or click to browse</p>
            {/if}
          </div>

          <input
            bind:this={fileInput}
            type="file"
            accept=".bib"
            class="hidden-input"
            onchange={onInputChange}
          />

          <!-- Folder selector -->
          <div class="folder-field">
            <label class="folder-label" for="import-folder">Import into folder</label>
            <select
              id="import-folder"
              class="folder-select"
              class:error={!!folderError}
              bind:value={selectedFolderId}
              onchange={() => folderError = null}
            >
              <option value={null}>— No folder (unfiled) —</option>
              {#each folders.flatten() as { folder, depth } (folder.id)}
                <option value={folder.id}>{'\u00a0\u00a0\u00a0\u00a0'.repeat(depth)}{folder.name}</option>
              {/each}
            </select>
            {#if folderError}
              <p class="folder-error">{folderError}</p>
            {/if}
          </div>

          {#if uploading}
            <p class="uploading-msg">Importing your references…</p>
          {/if}

        {:else if phase === 'done' && result}
          <div class="results">
            {#if result.added === 0 && result.skipped === 0}
              <p class="no-entries">No importable entries found in this file.</p>
            {:else}
              <div class="summary">
                <div class="summary-row success">
                  <CheckCircle size={18} />
                  <span>
                    <strong>{result.added}</strong> reference{result.added === 1 ? '' : 's'} imported successfully{selectedFolderName ? ` into "${selectedFolderName}"` : ''}
                  </span>
                </div>

                {#if result.skipped > 0}
                  <div class="summary-row skipped">
                    <SkipForward size={18} />
                    <span>
                      <strong>{result.skipped}</strong> reference{result.skipped === 1 ? '' : 's'} skipped — already in your library
                    </span>
                  </div>

                  {#if result.skipped_references.length > 0}
                    <div class="skipped-table-wrap">
                      <table class="skipped-table">
                        <thead>
                          <tr>
                            <th>Citation key</th>
                            <th>DOI</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {#each result.skipped_references as s}
                            <tr>
                              <td class="key-cell"><code>{s.citation_key}</code></td>
                              <td class="doi-cell">{s.doi}</td>
                              <td class="action-cell">
                                <a href="/references/{s.existing_id}" onclick={handleClose} class="view-link">
                                  View existing →
                                </a>
                              </td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </div>
                  {/if}
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        {#if phase === 'upload'}
          <Button variant="text" onclick={handleClose}>Cancel</Button>
          <Button loading={uploading} disabled={!file || uploading} onclick={doImport}>
            Import
          </Button>
        {:else}
          <Button variant="outlined" onclick={importAnother}>Import another</Button>
          <Button onclick={done}>Done</Button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }

  .modal {
    background: var(--color-surface-0); border-radius: 12px;
    box-shadow: var(--shadow-3); display: flex; flex-direction: column;
    width: min(560px, 100%); max-height: 88vh;
  }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--color-surface-3); flex-shrink: 0;
  }
  .modal-header h3 { margin: 0; font-size: 1.0625rem; font-weight: 500; }
  .close-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .close-btn:hover { background: var(--color-surface-2); }

  .modal-body { flex: 1; overflow-y: auto; padding: 24px; }

  /* Drop zone */
  .drop-zone {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; padding: 48px 24px;
    border: 2px dashed var(--color-surface-3); border-radius: 10px;
    background: var(--color-surface-1); cursor: pointer;
    transition: border-color var(--transition-standard), background var(--transition-standard);
    text-align: center;
  }
  .drop-zone:hover, .drop-zone.drag-over {
    border-color: var(--color-primary);
    background: var(--color-primary-subtle);
  }
  .drop-zone :global(.drop-icon) { color: var(--color-text-disabled); }
  .drop-zone:hover :global(.drop-icon), .drop-zone.drag-over :global(.drop-icon) {
    color: var(--color-primary);
  }
  .drop-label { margin: 0; font-size: 0.9375rem; font-weight: 500; color: var(--color-text-primary); }
  .drop-hint  { margin: 0; font-size: 0.8125rem; color: var(--color-text-secondary); }
  .filename   { margin: 0; font-size: 0.9375rem; font-weight: 500; color: var(--color-primary); word-break: break-all; }

  .hidden-input { display: none; }

  .folder-field { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; }
  .folder-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
  .folder-select {
    width: 100%; padding: 8px 10px; border-radius: 8px; font-size: 0.875rem; font-family: inherit;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1);
    color: var(--color-text-primary); outline: none; cursor: pointer;
    transition: border-color var(--transition-standard);
  }
  .folder-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  .folder-select.error { border-color: var(--color-error); }
  .folder-error { margin: 0; font-size: 0.8125rem; color: var(--color-error); }

  .uploading-msg {
    text-align: center; margin-top: 16px; font-size: 0.875rem; color: var(--color-text-secondary);
  }

  /* Results */
  .results { display: flex; flex-direction: column; gap: 16px; }

  .no-entries {
    text-align: center; color: var(--color-text-secondary);
    font-size: 0.9375rem; padding: 24px 0; margin: 0;
  }

  .summary { display: flex; flex-direction: column; gap: 10px; }

  .summary-row {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 8px; font-size: 0.9375rem;
  }
  .summary-row.success {
    background: color-mix(in srgb, var(--color-success) 10%, transparent);
    color: var(--color-success);
  }
  .summary-row.skipped {
    background: color-mix(in srgb, var(--color-warning) 12%, transparent);
    color: color-mix(in srgb, var(--color-warning) 70%, var(--color-text-primary));
  }
  .summary-row span { color: var(--color-text-primary); }

  .skipped-table-wrap {
    border: 1px solid var(--color-surface-3); border-radius: 8px; overflow: hidden;
    margin-top: 4px;
  }
  .skipped-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  .skipped-table th {
    text-align: left; padding: 8px 12px; font-weight: 500;
    color: var(--color-text-secondary); background: var(--color-surface-1);
    border-bottom: 1px solid var(--color-surface-3);
  }
  .skipped-table td { padding: 8px 12px; border-bottom: 1px solid var(--color-surface-2); vertical-align: middle; }
  .skipped-table tr:last-child td { border-bottom: none; }

  .key-cell code {
    font-family: monospace; font-size: 0.8125rem; background: var(--color-surface-2);
    padding: 1px 5px; border-radius: 4px;
  }
  .doi-cell { color: var(--color-text-secondary); word-break: break-all; }
  .action-cell { white-space: nowrap; }
  .view-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
  .view-link:hover { text-decoration: underline; }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 14px 24px; border-top: 1px solid var(--color-surface-3); flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .overlay { padding: 12px; }
    .drop-zone { padding: 32px 16px; }
  }
</style>
