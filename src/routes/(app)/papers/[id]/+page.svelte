<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { papersApi } from '$lib/api/papers'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import StatusChip from '$lib/components/ui/StatusChip.svelte'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import FileUpload from '$lib/components/forms/FileUpload.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import { formatDate, formatBytes, formatDoi } from '$lib/utils/format'
  import { Pencil, Users, Plus, ExternalLink, Download, FileText, Trash2 } from 'lucide-svelte'
  import type { Attachment } from '$lib/types/paper'

  let { data }: { data: PageData } = $props()
  let paper = $derived(data.paper)

  let noteSlideOpen    = $state(false)
  let newNote          = $state('')
  let savingNote       = $state(false)
  let deleteNoteTarget = $state<string | null>(null)

  let uploadingFile        = $state(false)
  let deleteAttachTarget   = $state<Attachment | null>(null)

  const activeNotes       = $derived((paper.notes ?? []).filter(n => !n.deleted))
  const activeAttachments = $derived(paper.attachments.filter(a => !a.deleted))

  async function addNote() {
    if (!newNote.trim()) return
    savingNote = true
    try {
      await papersApi.addNote(paper.id, newNote.trim())
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
      await papersApi.deleteNote(paper.id, deleteNoteTarget)
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
      await papersApi.upload(paper.id, file)
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
      const url = await papersApi.getDownloadUrl(paper.id, attach.id)
      window.open(url, '_blank')
    } catch {
      toast.error('Failed to get download URL')
    }
  }

  async function confirmDeleteAttachment() {
    if (!deleteAttachTarget) return
    try {
      await papersApi.deleteAttachment(paper.id, deleteAttachTarget.id)
      toast.success('Attachment deleted')
      deleteAttachTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete attachment')
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <div class="header-left">
      <a href="/papers" class="back-link">← Papers</a>
      <div class="title-row">
        <h1>{paper.title}</h1>
        <StatusChip label={paper.role} variant={paper.role === 'OWNER' ? 'info' : 'neutral'} />
      </div>
    </div>
    {#if paper.role === 'OWNER'}
      <div class="header-actions">
        <Button variant="outlined" size="sm" onclick={() => goto(`/papers/${paper.id}/viewers`)}>
          <Users size={16} /> Viewers
        </Button>
        <Button variant="outlined" size="sm" onclick={() => goto(`/papers/${paper.id}/edit`)}>
          <Pencil size={16} /> Edit
        </Button>
      </div>
    {/if}
  </div>

  <div class="layout">
    <div class="left-col">
      <div class="card">
        <h2 class="card-title">Metadata</h2>
        <div class="meta-grid">
          <span class="meta-label">Authors</span>
          <span>{paper.authors.join(', ')}</span>
          <span class="meta-label">Year</span>
          <span>{paper.year}</span>
          <span class="meta-label">Journal</span>
          <span>{paper.journal}</span>
          {#if paper.volume}
            <span class="meta-label">Volume</span>
            <span>{paper.volume}{paper.issue ? ` (${paper.issue})` : ''}</span>
          {/if}
          {#if paper.pages}
            <span class="meta-label">Pages</span>
            <span>{paper.pages}</span>
          {/if}
          {#if paper.doi}
            <span class="meta-label">DOI</span>
            <a href={formatDoi(paper.doi)} target="_blank" rel="noreferrer" class="doi-link">
              {paper.doi} <ExternalLink size={12} />
            </a>
          {/if}
          {#if paper.citation_count}
            <span class="meta-label">Citations</span>
            <span>{paper.citation_count.toLocaleString()}</span>
          {/if}
          {#if paper.categories.length}
            <span class="meta-label">Categories</span>
            <div class="chip-list">
              {#each paper.categories as cat}
                <span class="cat-chip">{cat}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      {#if paper.abstract}
        <div class="card">
          <h2 class="card-title">Abstract</h2>
          <p class="abstract">{paper.abstract}</p>
        </div>
      {/if}

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Attachments</h2>
          {#if paper.role === 'OWNER'}
            <FileUpload onfile={uploadFile} loading={uploadingFile} />
          {/if}
        </div>
        {#if activeAttachments.length === 0}
          <p class="empty-msg">No attachments</p>
        {:else}
          <ul class="attach-list">
            {#each activeAttachments as attach}
              <li class="attach-item">
                <FileText size={16} />
                <div class="attach-info">
                  <span class="attach-name">{attach.filename}</span>
                  <span class="attach-size">{formatBytes(attach.size_bytes)}</span>
                </div>
                <div class="attach-actions">
                  <button class="icon-btn" onclick={() => downloadAttachment(attach)}><Download size={16} /></button>
                  {#if paper.role === 'OWNER'}
                    <button class="icon-btn danger" onclick={() => deleteAttachTarget = attach}><Trash2 size={16} /></button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    {#if paper.role === 'OWNER'}
      <div class="right-col">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Notes</h2>
            <Button variant="tonal" size="sm" onclick={() => noteSlideOpen = true}>
              <Plus size={14} /> Add
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
                    <button class="icon-btn danger" onclick={() => deleteNoteTarget = note.id}><Trash2 size={14} /></button>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    {/if}
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

<ConfirmDialog
  open={!!deleteNoteTarget}
  title="Delete note?"
  message="This note will be permanently removed."
  confirmLabel="Delete"
  onconfirm={deleteNote}
  oncancel={() => deleteNoteTarget = null}
/>

<ConfirmDialog
  open={!!deleteAttachTarget}
  title="Delete attachment?"
  message="This file will be permanently removed."
  confirmLabel="Delete"
  onconfirm={confirmDeleteAttachment}
  oncancel={() => deleteAttachTarget = null}
/>

<style>
  .page { max-width: 1100px; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
  .header-left { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .back-link { font-size: 14px; color: var(--color-primary); text-decoration: none; }
  .title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 22px; font-weight: 500; line-height: 1.3; }
  .header-actions { display: flex; gap: 8px; flex-shrink: 0; }

  .layout { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; align-items: start; }
  @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } }

  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; padding: 20px; margin-bottom: 16px; }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .card-title { font-size: 15px; font-weight: 500; margin: 0 0 16px; }
  .card-header .card-title { margin: 0; }

  .meta-grid { display: grid; grid-template-columns: 100px 1fr; gap: 8px 16px; font-size: 14px; }
  .meta-label { color: var(--color-text-secondary); font-weight: 500; }
  .doi-link { color: var(--color-primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-size: 13px; }

  .chip-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .cat-chip { padding: 2px 8px; border-radius: 12px; font-size: 12px; background: var(--color-surface-2); color: var(--color-text-secondary); }

  .abstract { font-size: 14px; line-height: 1.7; margin: 0; }

  .attach-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .attach-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--color-surface-1); border-radius: 8px; color: var(--color-text-secondary); }
  .attach-info { flex: 1; min-width: 0; }
  .attach-name { font-size: 13px; color: var(--color-text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attach-size { font-size: 11px; color: var(--color-text-disabled); }
  .attach-actions { display: flex; gap: 4px; }

  .note-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .note-item { padding: 12px; background: var(--color-surface-1); border-radius: 8px; border-left: 3px solid var(--color-primary-subtle); }
  .note-text { font-size: 14px; line-height: 1.6; margin: 0 0 8px; }
  .note-footer { display: flex; align-items: center; justify-content: space-between; }
  .note-date { font-size: 11px; color: var(--color-text-disabled); }

  .note-form { display: flex; flex-direction: column; gap: 16px; }
  .note-form :global(textarea) {
    width: 100%; padding: 8px 12px; border-radius: 6px; resize: vertical;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-0);
    color: var(--color-text-primary); font-size: 14px; font-family: inherit; outline: none;
  }
  .note-form :global(textarea:focus) { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .empty-msg { font-size: 14px; color: var(--color-text-secondary); margin: 0; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .icon-btn:hover { background: var(--color-surface-2); }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }
</style>
