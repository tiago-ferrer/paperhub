<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import StatusChip from '$lib/components/ui/StatusChip.svelte'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import FileUpload from '$lib/components/forms/FileUpload.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import AddToProjectModal from '$lib/components/projects/AddToProjectModal.svelte'
  import { formatDate, formatBytes, formatDoi } from '$lib/utils/format'
  import { Pencil, Users, Plus, ExternalLink, Download, FileText, Trash2, Eye, FolderOpen, FileCheck, Maximize2, Minimize2 } from 'lucide-svelte'
  import type { Attachment } from '$lib/types/reference'

  let { data }: { data: PageData } = $props()
  let reference = $derived(data.reference)

  let showAddToProject  = $state(false)
  let noteSlideOpen     = $state(false)
  let newNote           = $state('')
  let savingNote        = $state(false)
  let deleteNoteTarget  = $state<string | null>(null)

  let uploadingFile      = $state(false)
  let deleteAttachTarget = $state<Attachment | null>(null)

  let pdfUrl           = $state<string | null>(null)
  let loadingPdfId     = $state<string | null>(null)
  let loadingAnnotId   = $state<string | null>(null)
  let pdfColEl         = $state<HTMLElement | null>(null)
  let pdfExpanded      = $state(false)

  $effect(() => {
    if (pdfUrl && pdfColEl) {
      pdfColEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })

  const activeNotes       = $derived((reference.notes ?? []).filter(n => !n.deleted))
  const activeAttachments = $derived(reference.attachments.filter(a => !a.deleted))

  async function viewPdf(attach: Attachment) {
    loadingPdfId = attach.id
    pdfUrl = null
    try {
      pdfUrl = await referencesApi.getDownloadUrl(reference.id, attach.id)
    } catch {
      toast.error('Failed to load file')
    } finally {
      loadingPdfId = null
    }
  }

  async function viewAnnotatedPdf(attach: Attachment) {
    loadingAnnotId = attach.id
    pdfUrl = null
    try {
      pdfUrl = await referencesApi.getAnnotationUrl(reference.id, attach.id)
    } catch {
      toast.error('Failed to load annotated file')
    } finally {
      loadingAnnotId = null
    }
  }

  async function addNote() {
    if (!newNote.trim()) return
    savingNote = true
    try {
      await referencesApi.addNote(reference.id, newNote.trim())
      newNote = ''
      toast.success('Note added')
      noteSlideOpen = false
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to add note')
    } finally {
      savingNote = false
    }
  }

  async function deleteNote() {
    if (!deleteNoteTarget) return
    try {
      await referencesApi.deleteNote(reference.id, deleteNoteTarget)
      toast.success('Note deleted')
      deleteNoteTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete note')
    }
  }

  async function uploadFile(file: File) {
    uploadingFile = true
    try {
      await referencesApi.upload(reference.id, file)
      toast.success(`${file.name} uploaded`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed')
    } finally {
      uploadingFile = false
    }
  }

  async function downloadAttachment(attach: Attachment) {
    try {
      const url = await referencesApi.getDownloadUrl(reference.id, attach.id)
      window.open(url, '_blank')
    } catch {
      toast.error('Failed to download file')
    }
  }

  async function confirmDeleteAttachment() {
    if (!deleteAttachTarget) return
    try {
      await referencesApi.deleteAttachment(reference.id, deleteAttachTarget.id)
      toast.success('Attachment deleted')
      deleteAttachTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete attachment')
    }
  }
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && pdfExpanded) pdfExpanded = false }} />

<div class="page">
  <div class="page-header">
    <div class="header-left">
      <a href="/references" class="back-link">← References</a>
      <div class="title-row">
        <span class="entry-badge">{reference.entry_type}</span>
        <h1>{reference.title}</h1>
        <StatusChip label={reference.role} variant={reference.role === 'OWNER' ? 'info' : 'neutral'} />
      </div>
      {#if reference.citation_key}
        <span class="citation-key">cite: {reference.citation_key}</span>
      {/if}
    </div>
    <div class="header-actions">
      <Button variant="outlined" size="sm" onclick={() => showAddToProject = true}>
        <FolderOpen size={20} /><span class="btn-label"> Add to Project</span>
      </Button>
      {#if reference.role === 'OWNER'}
        <Button variant="outlined" size="sm" onclick={() => goto(`/references/${reference.id}/viewers`)}>
          <Users size={20} /><span class="btn-label"> Viewers</span>
        </Button>
        <Button variant="outlined" size="sm" onclick={() => goto(`/references/${reference.id}/edit`)}>
          <Pencil size={20} /><span class="btn-label"> Edit</span>
        </Button>
      {/if}
    </div>
  </div>

  <div class="layout">
    <!-- Left column -->
    <div class="left-col">
      <div class="card">
        <h2 class="card-title">Metadata</h2>
        <div class="meta-grid">
          {#if reference.author?.length}
            <span class="meta-label">Authors</span>
            <span>{reference.author.join(', ')}</span>
          {/if}
          {#if reference.editor?.length}
            <span class="meta-label">Editors</span>
            <span>{reference.editor.join(', ')}</span>
          {/if}
          {#if reference.year}
            <span class="meta-label">Year</span>
            <span>{reference.year}{reference.month ? ` (${reference.month})` : ''}</span>
          {/if}
          {#if reference.journal}
            <span class="meta-label">Journal</span>
            <span>{reference.journal}</span>
          {/if}
          {#if reference.booktitle}
            <span class="meta-label">Booktitle</span>
            <span>{reference.booktitle}</span>
          {/if}
          {#if reference.publisher}
            <span class="meta-label">Publisher</span>
            <span>{reference.publisher}{reference.address ? `, ${reference.address}` : ''}</span>
          {/if}
          {#if reference.volume}
            <span class="meta-label">Volume</span>
            <span>{reference.volume}{reference.number ? ` (${reference.number})` : ''}</span>
          {/if}
          {#if !reference.volume && reference.number}
            <span class="meta-label">No.</span>
            <span>{reference.number}</span>
          {/if}
          {#if reference.pages}
            <span class="meta-label">Pages</span>
            <span>{reference.pages}</span>
          {/if}
          {#if reference.series}
            <span class="meta-label">Series</span>
            <span>{reference.series}</span>
          {/if}
          {#if reference.edition}
            <span class="meta-label">Edition</span>
            <span>{reference.edition}</span>
          {/if}
          {#if reference.doi}
            <span class="meta-label">DOI</span>
            <a href={formatDoi(reference.doi)} target="_blank" rel="noreferrer" class="doi-link">
              {reference.doi} <ExternalLink size={16} />
            </a>
          {/if}
          {#if reference.url}
            <span class="meta-label">URL</span>
            <a href={reference.url} target="_blank" rel="noreferrer" class="doi-link">
              Link <ExternalLink size={16} />
            </a>
          {/if}
          {#if reference.citation_count}
            <span class="meta-label">Citations</span>
            <span>{reference.citation_count.toLocaleString()}</span>
          {/if}
          {#if reference.categories?.length}
            <span class="meta-label">Categories</span>
            <div class="chip-list">
              {#each reference.categories as cat}
                <span class="cat-chip">{cat}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      {#if reference.abstract}
        <div class="card">
          <h2 class="card-title">Abstract</h2>
          <p class="abstract">{reference.abstract}</p>
        </div>
      {/if}

      {#if reference.note}
        <div class="card">
          <h2 class="card-title">Bibliographic note</h2>
          <p class="bib-note">{reference.note}</p>
        </div>
      {/if}

      {#if reference.role === 'OWNER'}
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">My notes</h2>
            <Button variant="tonal" size="sm" onclick={() => noteSlideOpen = true}>
              <Plus size={18} /> Add
            </Button>
          </div>
          {#if activeNotes.length === 0}
            <p class="empty-msg">No notes yet</p>
          {:else}
            <ul class="note-list">
              {#each activeNotes as note}
                <li class="note-item">
                  <p class="note-text">{note.note}</p>
                  <div class="note-footer">
                    <span class="note-date">{formatDate(note.created_at)}</span>
                    <button class="icon-btn danger" onclick={() => deleteNoteTarget = note.id}><Trash2 size={18} /></button>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Attachments</h2>
          {#if reference.role === 'OWNER'}
            <FileUpload onfile={uploadFile} loading={uploadingFile} />
          {/if}
        </div>
        {#if activeAttachments.length === 0}
          <p class="empty-msg">No attachments</p>
        {:else}
          <ul class="attach-list">
            {#each activeAttachments as attach}
              <li class="attach-item">
                <FileText size={20} />
                <div class="attach-info">
                  <span class="attach-name">{attach.filename}</span>
                  <span class="attach-size">{formatBytes(attach.size_bytes)}</span>
                </div>
                <div class="attach-actions">
                  {#if attach.annotation_key !== null}
                    <button
                      class="icon-btn"
                      onclick={() => viewAnnotatedPdf(attach)}
                      data-tooltip="View with annotations"
                      disabled={loadingAnnotId === attach.id}
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      class="icon-btn"
                      onclick={() => viewPdf(attach)}
                      data-tooltip="View original"
                      disabled={loadingPdfId === attach.id}
                    >
                      <FileCheck size={20} />
                    </button>
                  {:else}
                    <button
                      class="icon-btn"
                      onclick={() => viewPdf(attach)}
                      data-tooltip="View"
                      disabled={loadingPdfId === attach.id}
                    >
                      <Eye size={20} />
                    </button>
                  {/if}
                  <button class="icon-btn" data-tooltip="Download" onclick={() => downloadAttachment(attach)}><Download size={20} /></button>
                  {#if reference.role === 'OWNER'}
                    <button class="icon-btn danger" data-tooltip="Delete" onclick={() => deleteAttachTarget = attach}><Trash2 size={20} /></button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <!-- Right column: PDF viewer -->
    <div class="right-col" class:pdf-hidden={!pdfUrl} class:expanded={pdfExpanded} bind:this={pdfColEl}>
      <div class="card pdf-card">
        <div class="pdf-viewer-header">
          <h2 class="card-title">PDF Viewer</h2>
          {#if pdfUrl}
            <button
              class="icon-btn"
              onclick={() => pdfExpanded = !pdfExpanded}
              title={pdfExpanded ? 'Exit full screen (Esc)' : 'Full screen'}
            >
              {#if pdfExpanded}
                <Minimize2 size={18} />
              {:else}
                <Maximize2 size={18} />
              {/if}
            </button>
          {/if}
        </div>
        {#if pdfUrl}
          <a href={pdfUrl} target="_blank" rel="noopener" class="pdf-open-btn">Open PDF in browser</a>
          <div class="pdf-scroll-wrap">
            <iframe src={pdfUrl} title="PDF Viewer" class="pdf-iframe"></iframe>
          </div>
        {:else}
          <div class="pdf-empty">
            <FileText size={40} />
            <p>Click <Eye size={14} /> on a PDF attachment to view it here</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<SlideOver open={noteSlideOpen} title="Add Note" onclose={() => noteSlideOpen = false}>
  <div class="note-form">
    <FormField label="Note">
      <textarea bind:value={newNote} rows={6} placeholder="Write your note…"></textarea>
    </FormField>
    <Button onclick={addNote} loading={savingNote} disabled={!newNote.trim()}>Save Note</Button>
  </div>
</SlideOver>

<AddToProjectModal
  open={showAddToProject}
  entityType="PAPER"
  entityId={reference.id}
  onclose={() => showAddToProject = false}
/>

<DestructiveConfirmDialog
  open={!!deleteNoteTarget}
  title="Delete note?"
  message="This note will be permanently removed."
  confirmPhrase="I want to delete this note"
  confirmLabel="Delete"
  onconfirm={deleteNote}
  oncancel={() => deleteNoteTarget = null}
/>

<DestructiveConfirmDialog
  open={!!deleteAttachTarget}
  title="Delete attachment?"
  message="This file will be permanently removed."
  confirmPhrase={`I want to delete ${deleteAttachTarget?.filename ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDeleteAttachment}
  oncancel={() => deleteAttachTarget = null}
/>

<style>
  .page { max-width: 100%; overflow-x: hidden; }
  .card { width: 100%; box-sizing: border-box; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
  .header-left { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
  .title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .header-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

  .entry-badge {
    display: inline-block; padding: 3px 9px; border-radius: 8px; flex-shrink: 0;
    font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
    background: var(--color-primary-subtle); color: var(--color-primary);
  }
  .citation-key {
    font-size: 0.8125rem; color: var(--color-text-disabled);
    font-family: monospace; letter-spacing: 0.02em;
  }

  .layout { display: grid; grid-template-columns: 1fr minmax(0, 50%); gap: 20px; align-items: start; }
  @media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } }
  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .header-actions { width: 100%; justify-content: flex-end; }
    .btn-label { display: none; }
    .card { padding: 14px 12px; }
    .meta-grid { grid-template-columns: 80px 1fr; gap: 6px 10px; font-size: 0.8125rem; }
    .attach-item { flex-wrap: wrap; }
    .attach-info { min-width: 0; flex: 1 1 120px; }
    .attach-actions { margin-left: auto; }
    .pdf-scroll-wrap { height: 70vh; min-height: 280px; }
    .right-col.pdf-hidden { display: none; }
  }

  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; padding: 20px; margin-bottom: 16px; }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .card-title { font-size: 0.9375rem; font-weight: 500; margin: 0 0 16px; }
  .card-header .card-title { margin: 0; }

  .meta-grid { display: grid; grid-template-columns: 100px 1fr; gap: 8px 16px; font-size: 0.875rem; }
  .meta-label { color: var(--color-text-secondary); font-weight: 500; }
  .doi-link { color: var(--color-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-size: 0.8125rem; }

  .chip-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .cat-chip { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; background: var(--color-surface-2); color: var(--color-text-secondary); }

  .abstract { font-size: 0.875rem; line-height: 1.7; margin: 0; }
  .bib-note { font-size: 0.875rem; line-height: 1.6; margin: 0; color: var(--color-text-secondary); font-style: italic; }

  .attach-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .attach-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--color-surface-1); border-radius: 8px; color: var(--color-text-secondary); }
  .attach-info { flex: 1; min-width: 0; }
  .attach-name { font-size: 0.8125rem; color: var(--color-text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attach-size { font-size: 0.6875rem; color: var(--color-text-disabled); }
  .attach-actions { display: flex; gap: 4px; }

  .note-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .note-item { padding: 12px; background: var(--color-surface-1); border-radius: 8px; border-left: 3px solid var(--color-primary-subtle); }
  .note-text { font-size: 0.875rem; line-height: 1.6; margin: 0 0 8px; }
  .note-footer { display: flex; align-items: center; justify-content: space-between; }
  .note-date { font-size: 0.6875rem; color: var(--color-text-disabled); }

  .pdf-open-btn {
    display: none; margin-bottom: 10px;
    padding: 10px 16px; border-radius: 8px; text-align: center;
    background: var(--color-primary); color: white; text-decoration: none;
    font-size: 0.875rem; font-weight: 500;
  }
  @media (max-width: 1019px) { .pdf-open-btn { display: block; } }

  .pdf-viewer-header {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  }
  .pdf-viewer-header .card-title { margin: 0; }

  .pdf-card { display: flex; flex-direction: column; position: sticky; top: 80px; }
  .pdf-scroll-wrap {
    width: 100%; height: calc(100vh - 220px); min-height: 400px;
    overflow: auto; -webkit-overflow-scrolling: touch; border-radius: 6px;
  }
  .pdf-iframe { width: 100%; height: 100%; border: none; display: block; overflow: auto; }

  /* Full-screen expanded state */
  .right-col.expanded {
    position: fixed; inset: 0; z-index: 100;
  }
  .right-col.expanded .pdf-card {
    height: 100%; border-radius: 0; border: none; margin: 0; position: static;
  }
  .right-col.expanded .pdf-scroll-wrap {
    flex: 1; height: auto; min-height: 0; border-radius: 0;
  }
  .right-col.expanded .pdf-open-btn { display: none; }
  .pdf-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; height: 300px; color: var(--color-text-disabled);
    background: var(--color-surface-1); border-radius: 6px;
  }
  .pdf-empty p { font-size: 0.875rem; margin: 0; display: flex; align-items: center; gap: 4px; }

  .note-form { display: flex; flex-direction: column; gap: 16px; }
  .note-form :global(textarea) {
    width: 100%; padding: 8px 12px; border-radius: 6px; resize: vertical;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 0.875rem; font-family: inherit; outline: none;
  }
  .note-form :global(textarea:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .empty-msg { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; }

  .icon-btn {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .icon-btn:hover { background: var(--color-surface-2); }
  .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  .icon-btn[data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-surface-3);
    color: var(--color-text-primary);
    font-size: 0.6875rem;
    white-space: nowrap;
    padding: 3px 8px;
    border-radius: 4px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 10;
  }
  .icon-btn[data-tooltip]:not(:disabled):hover::after { opacity: 1; }
</style>
