<script lang="ts">
  import type { PageData } from './$types'
  import { goto } from '$app/navigation'
  import { transcriptionApi } from '$lib/api/transcription'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { TranscriptionNote } from '$lib/types/transcription'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import LanguageSelector from '$lib/components/forms/LanguageSelector.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import MarkdownContent from '$lib/components/ui/MarkdownContent.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import { renderMarkdown, stripMarkdown } from '$lib/utils/markdown'
  import { formatDate } from '$lib/utils/format'
  import { Pencil, RotateCcw, Plus, Sparkles, Trash2, Eye, ChevronDown, ChevronRight, X, Download } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let transcription = $state({ ...data.transcription })
  let notes         = $state([...data.notes.items])
  let group         = $derived(data.group)

  $effect(() => { transcription = { ...data.transcription } })
  $effect(() => { notes = [...data.notes.items] })

  // ── Audio ──────────────────────────────────────────────────────────────────
  let audioUrl     = $state<string | null>(null)
  let audioError   = $state<string | null>(null)
  let loadingAudio = $state(false)

  // Revoke the blob URL when the component is destroyed
  $effect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) })

  async function loadAudio() {
    if (loadingAudio || audioUrl || !transcription.audio_attachment) return
    loadingAudio = true
    audioError = null
    try {
      audioUrl = await transcriptionApi.getAudioBlobUrl(
        transcription.group_id, transcription.id, transcription.audio_attachment.filename
      )
    } catch {
      audioError = 'Could not load audio player.'
    } finally {
      loadingAudio = false
    }
  }

  // ── Polling ────────────────────────────────────────────────────────────────
  $effect(() => {
    if (transcription.transcript_status !== 'PROCESSING') return
    const id = setInterval(async () => {
      try {
        const updated = await transcriptionApi.getTranscription(transcription.group_id, transcription.id)
        transcription = updated
      } catch { /* ignore poll errors */ }
    }, 5000)
    return () => clearInterval(id)
  })

  // ── Collapsible transcript ─────────────────────────────────────────────────
  let transcriptCollapsed = $state(true)

  // ── Inline meta edit ───────────────────────────────────────────────────────
  let editingMeta = $state(false)
  let editName    = $state(transcription.name)
  let editDate    = $state(transcription.date)
  let savingMeta  = $state(false)
  let metaErrors  = $state<Record<string, string>>({})

  function startEditMeta() {
    editName = transcription.name
    editDate = transcription.date
    metaErrors = {}
    editingMeta = true
  }

  async function saveMeta(e: SubmitEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!editName.trim()) errs.editName = 'Name is required'
    if (!editDate) errs.editDate = 'Date is required'
    metaErrors = errs
    if (Object.keys(errs).length) return
    savingMeta = true
    try {
      const updated = await transcriptionApi.patchTranscription(transcription.group_id, transcription.id, {
        name: editName.trim(),
        date: editDate,
      })
      transcription = updated
      editingMeta = false
      toast.success('Saved')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save')
    } finally {
      savingMeta = false
    }
  }

  // ── Retry transcription ────────────────────────────────────────────────────
  let retrying = $state(false)
  let retryLanguage = $state(transcription.audio_language || '')
  let showRetryLanguage = $state(false)

  async function retryTranscription() {
    retrying = true
    try {
      await transcriptionApi.triggerTranscription(transcription.group_id, transcription.id, retryLanguage || undefined)
      const updated = await transcriptionApi.getTranscription(transcription.group_id, transcription.id)
      transcription = updated
      showRetryLanguage = false
      toast.info('Transcription started')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to retry')
    } finally {
      retrying = false
    }
  }

  // ── Delete transcription ───────────────────────────────────────────────────
  let deleteTranscriptionOpen = $state(false)
  let deletingTranscription   = $state(false)

  async function confirmDeleteTranscription() {
    deletingTranscription = true
    try {
      await transcriptionApi.removeTranscription(transcription.group_id, transcription.id)
      toast.success('Recording deleted')
      goto(`/transcription/${transcription.group_id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete')
    } finally {
      deletingTranscription = false
      deleteTranscriptionOpen = false
    }
  }

  // ── Note create form ───────────────────────────────────────────────────────
  let showNoteForm   = $state(false)
  let noteTitle      = $state('')
  let noteContent    = $state('')
  let noteEditorMode = $state<'edit' | 'preview'>('edit')
  let savingNote     = $state(false)
  let noteErrors     = $state<Record<string, string>>({})
  const notePreviewHtml = $derived(noteContent ? renderMarkdown(noteContent) : '')

  function openNoteForm() {
    noteTitle = ''
    noteContent = ''
    noteEditorMode = 'edit'
    noteErrors = {}
    selectedNote = null
    showNoteForm = true
  }

  async function submitNote(e: SubmitEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!noteTitle.trim()) errs.noteTitle = 'Title is required'
    if (!noteContent.trim()) errs.noteContent = 'Content is required'
    noteErrors = errs
    if (Object.keys(errs).length) return
    savingNote = true
    try {
      const note = await transcriptionApi.createNote(transcription.group_id, transcription.id, {
        title: noteTitle.trim(),
        content: noteContent.trim(),
      })
      notes = [note, ...notes]
      showNoteForm = false
      selectedNote = note
      noteDetailMode = 'view'
      toast.success('Note created')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create note')
    } finally {
      savingNote = false
    }
  }

  // ── AI note generation ─────────────────────────────────────────────────────
  let generatingNotes = $state(false)
  let generationError = $state<string | null>(null)
  const canGenerate   = $derived(transcription.transcript_status === 'COMPLETED')
  const hasNotePrompt = $derived(!!group.note_prompt?.trim())

  async function generateNote() {
    if (!canGenerate || !hasNotePrompt) return
    generatingNotes = true
    generationError = null
    showNoteForm = false
    selectedNote = null
    try {
      const note = await transcriptionApi.generateNote(transcription.group_id, transcription.id)
      notes = [note, ...notes]
      selectedNote = note
      noteDetailMode = 'view'
      toast.success('Note generated')
    } catch (err) {
      generationError = err instanceof ApiError ? err.message : 'Failed to generate note'
    } finally {
      generatingNotes = false
    }
  }

  // ── Inline note detail ─────────────────────────────────────────────────────
  let selectedNote     = $state<TranscriptionNote | null>(null)
  let noteDetailMode   = $state<'view' | 'edit'>('view')
  let editNoteTitle    = $state('')
  let editNoteContent  = $state('')
  let editNoteEdMode   = $state<'edit' | 'preview'>('edit')
  let savingEditNote   = $state(false)
  let deleteNoteTarget = $state<TranscriptionNote | null>(null)
  let noteDetailEl     = $state<HTMLElement | null>(null)

  const selectedNoteHtml    = $derived(selectedNote ? renderMarkdown(selectedNote.content) : '')
  const editNotePreviewHtml = $derived(editNoteContent ? renderMarkdown(editNoteContent) : '')

  function downloadNote(note: TranscriptionNote) {
    const blob = new Blob([note.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openNote(note: TranscriptionNote) {
    if (selectedNote?.id === note.id && noteDetailMode === 'view') {
      selectedNote = null
      return
    }
    selectedNote = note
    noteDetailMode = 'view'
    showNoteForm = false
    // Scroll the detail panel into view after render
    setTimeout(() => noteDetailEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  function startEditNote() {
    if (!selectedNote) return
    editNoteTitle = selectedNote.title
    editNoteContent = selectedNote.content
    editNoteEdMode = 'edit'
    noteDetailMode = 'edit'
  }

  async function saveEditNote(e: SubmitEvent) {
    e.preventDefault()
    if (!selectedNote) return
    savingEditNote = true
    try {
      const updated = await transcriptionApi.patchNote(
        transcription.group_id, transcription.id, selectedNote.id,
        { title: editNoteTitle.trim(), content: editNoteContent.trim() }
      )
      selectedNote = updated
      const idx = notes.findIndex(n => n.id === updated.id)
      if (idx !== -1) notes[idx] = updated
      noteDetailMode = 'view'
      toast.success('Note saved')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save note')
    } finally {
      savingEditNote = false
    }
  }

  async function confirmDeleteNote() {
    if (!deleteNoteTarget) return
    try {
      await transcriptionApi.removeNote(transcription.group_id, transcription.id, deleteNoteTarget.id)
      notes = notes.filter(n => n.id !== deleteNoteTarget!.id)
      if (selectedNote?.id === deleteNoteTarget.id) selectedNote = null
      deleteNoteTarget = null
      toast.success('Note deleted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete note')
      deleteNoteTarget = null
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <div class="header-left">
      <a href="/transcription/{transcription.group_id}" class="back-link">← {group.name}</a>
      <h1>{transcription.name}</h1>
      <span class="rec-date">{transcription.date} · Uploaded {formatDate(transcription.created_at)}</span>
    </div>
    <div class="header-actions">
      <Button variant="text" size="sm" onclick={() => deleteTranscriptionOpen = true}>
        <Trash2 size={16} /> Delete
      </Button>
    </div>
  </div>

  <!-- ── Audio card ─────────────────────────────────────────────────────────── -->
  <div class="card">
    <div class="card-title-row">
      <h2 class="card-title">Audio</h2>
      {#if !editingMeta}
        <button class="icon-btn" title="Edit name & date" onclick={startEditMeta}>
          <Pencil size={16} />
        </button>
      {/if}
    </div>

    {#if editingMeta}
      <form onsubmit={saveMeta} class="meta-form">
        <FormField label="Name" required error={metaErrors.editName}>
          <input type="text" bind:value={editName} />
        </FormField>
        <FormField label="Date" required error={metaErrors.editDate}>
          <input type="date" bind:value={editDate} />
        </FormField>
        <div class="meta-actions">
          <Button variant="outlined" size="sm" onclick={() => editingMeta = false}>Cancel</Button>
          <Button type="submit" size="sm" loading={savingMeta}>Save</Button>
        </div>
      </form>
    {:else}
      <div class="rec-meta">
        <span class="rec-name">{transcription.name}</span>
        <span class="rec-date-label">{transcription.date}</span>
        {#if transcription.audio_language}
          <span class="rec-language">Language: {transcription.audio_language}</span>
        {/if}
      </div>
    {/if}

    {#if !transcription.audio_attachment}
      <p class="audio-empty">No audio file attached.</p>
    {:else if audioError}
      <div class="audio-error-row">
        <p class="audio-error">{audioError}</p>
        <Button variant="outlined" size="sm" onclick={loadAudio}>Retry</Button>
      </div>
    {:else if audioUrl}
      <!-- svelte-ignore a11y_media_has_caption -->
      <audio class="audio-player" controls autoplay src={audioUrl} preload="auto">
        Your browser does not support audio playback.
      </audio>
    {:else}
      <button class="audio-load-btn" onclick={loadAudio} disabled={loadingAudio}>
        {#if loadingAudio}
          <Spinner size={18} />
          <span>Loading…</span>
        {:else}
          <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <span>Play — {transcription.audio_attachment.filename}</span>
        {/if}
      </button>
    {/if}
  </div>

  <!-- ── Transcript card (collapsible) ─────────────────────────────────────── -->
  <div class="card transcript-card">
    <button class="transcript-toggle" onclick={() => transcriptCollapsed = !transcriptCollapsed}>
      <div class="toggle-left">
        {#if transcriptCollapsed}
          <ChevronRight size={18} />
        {:else}
          <ChevronDown size={18} />
        {/if}
        <h2 class="card-title">Transcript</h2>
      </div>
      <span
        class="status-badge"
        class:status-pending={transcription.transcript_status === 'PENDING'}
        class:status-processing={transcription.transcript_status === 'PROCESSING'}
        class:status-completed={transcription.transcript_status === 'COMPLETED'}
        class:status-failed={transcription.transcript_status === 'FAILED'}
      >
        {#if transcription.transcript_status === 'PROCESSING'}
          <Spinner size={11} />
        {/if}
        {transcription.transcript_status}
      </span>
    </button>

    {#if !transcriptCollapsed}
      <div class="transcript-body">
        {#if transcription.transcript_status === 'PENDING'}
          <p class="transcript-msg muted">Waiting to be processed…</p>
        {:else if transcription.transcript_status === 'PROCESSING'}
          <div class="transcript-processing">
            <Spinner />
            <span>Transcribing… This may take a few minutes.</span>
          </div>
        {:else if transcription.transcript_status === 'COMPLETED'}
          <pre class="transcript-text">{transcription.transcript_text}</pre>
        {:else if transcription.transcript_status === 'FAILED'}
          <p class="transcript-msg error">Transcription failed.</p>
          {#if showRetryLanguage}
            <form onsubmit={(e) => { e.preventDefault(); retryTranscription() }} class="retry-form">
              <LanguageSelector bind:value={retryLanguage} />
              <div class="retry-actions">
                <Button variant="outlined" size="sm" type="button" onclick={() => showRetryLanguage = false}>Cancel</Button>
                <Button size="sm" loading={retrying} type="submit">Retry</Button>
              </div>
            </form>
          {:else}
            <Button size="sm" loading={retrying} onclick={() => showRetryLanguage = true}>
              <RotateCcw size={16} /> Retry
            </Button>
          {/if}
        {/if}
      </div>
    {/if}
  </div>

  <!-- ── Notes card ─────────────────────────────────────────────────────────── -->
  <div class="card notes-card">
    <div class="notes-header">
      <h2 class="card-title">Notes</h2>
      <div class="notes-actions">
        {#if !generatingNotes}
          {#if !showNoteForm}
            <Button variant="outlined" size="sm" onclick={openNoteForm}>
              <Plus size={16} /> Write note
            </Button>
          {/if}
          <div title={!hasNotePrompt ? 'Set an AI prompt on this group to enable note generation' : ''}>
            <Button
              size="sm"
              variant="tonal"
              disabled={!canGenerate || !hasNotePrompt}
              onclick={generateNote}
            >
              <Sparkles size={16} /> Generate with AI
            </Button>
          </div>
        {/if}
      </div>
    </div>

    {#if generatingNotes}
      <div class="generation-overlay">
        <Spinner />
        <span>Generating notes…</span>
        <p class="generation-hint">This may take a moment.</p>
      </div>
    {:else}
      {#if generationError}
        <div class="inline-error">{generationError}</div>
      {/if}

      <!-- Create note form -->
      {#if showNoteForm}
        <div class="note-form-wrap">
          <form onsubmit={submitNote} class="note-form">
            <FormField label="Title" required error={noteErrors.noteTitle}>
              <input type="text" bind:value={noteTitle} placeholder="Note title…" />
            </FormField>
            <div class="editor-section">
              <div class="editor-toolbar">
                <span class="toolbar-label">
                  Content
                  {#if noteErrors.noteContent}<span class="err"> — {noteErrors.noteContent}</span>{/if}
                </span>
                <div class="mode-toggle">
                  <button type="button" class="mode-btn" class:active={noteEditorMode === 'edit'} onclick={() => noteEditorMode = 'edit'}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button type="button" class="mode-btn" class:active={noteEditorMode === 'preview'} onclick={() => noteEditorMode = 'preview'}>
                    <Eye size={13} /> Preview
                  </button>
                </div>
              </div>
              {#if noteEditorMode === 'edit'}
                <textarea bind:value={noteContent} class="md-editor" class:has-error={!!noteErrors.noteContent} rows={10} placeholder="Write in Markdown…"></textarea>
              {:else}
                <div class="md-preview">
                  {#if notePreviewHtml}<MarkdownContent html={notePreviewHtml} />{:else}<p class="preview-empty">Nothing to preview yet.</p>{/if}
                </div>
              {/if}
            </div>
            <div class="form-actions">
              <Button variant="outlined" size="sm" onclick={() => showNoteForm = false}>Cancel</Button>
              <Button type="submit" size="sm" loading={savingNote}>Save Note</Button>
            </div>
          </form>
        </div>
      {/if}

      <!-- Note list -->
      {#if notes.length === 0 && !showNoteForm}
        <p class="notes-empty">
          No notes yet.
          {#if canGenerate && hasNotePrompt}Use <em>Generate with AI</em> or{:else}Click{/if}
          <em>Write note</em> to add one.
        </p>
      {:else if notes.length > 0}
        <div class="note-list">
          {#each notes as note}
            <button
              class="note-card"
              class:selected={selectedNote?.id === note.id}
              onclick={() => openNote(note)}
            >
              <div class="note-card-title">{note.title}</div>
              <p class="note-preview">{stripMarkdown(note.content, 120)}</p>
              <span class="note-date">{formatDate(note.updated_at)}</span>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Inline note detail (below note list) -->
      {#if selectedNote}
        <div class="note-detail" bind:this={noteDetailEl}>
          {#if noteDetailMode === 'view'}
            <div class="note-detail-header">
              <h3 class="note-detail-title">{selectedNote.title}</h3>
              <div class="note-detail-actions">
                <button class="icon-btn" title="Download as .md" onclick={() => downloadNote(selectedNote!)}><Download size={16} /></button>
                <button class="icon-btn" title="Edit note" onclick={startEditNote}><Pencil size={16} /></button>
                <button class="icon-btn danger" title="Delete note" onclick={() => deleteNoteTarget = selectedNote}><Trash2 size={16} /></button>
                <button class="icon-btn" title="Close" onclick={() => selectedNote = null}><X size={16} /></button>
              </div>
            </div>
            <div class="note-detail-body">
              <MarkdownContent html={selectedNoteHtml} />
            </div>
          {:else}
            <form onsubmit={saveEditNote} class="note-edit-form">
              <FormField label="Title" required>
                <input type="text" bind:value={editNoteTitle} />
              </FormField>
              <div class="editor-section">
                <div class="editor-toolbar">
                  <span class="toolbar-label">Content</span>
                  <div class="mode-toggle">
                    <button type="button" class="mode-btn" class:active={editNoteEdMode === 'edit'} onclick={() => editNoteEdMode = 'edit'}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button type="button" class="mode-btn" class:active={editNoteEdMode === 'preview'} onclick={() => editNoteEdMode = 'preview'}>
                      <Eye size={13} /> Preview
                    </button>
                  </div>
                </div>
                {#if editNoteEdMode === 'edit'}
                  <textarea bind:value={editNoteContent} class="md-editor" rows={14}></textarea>
                {:else}
                  <div class="md-preview">
                    {#if editNotePreviewHtml}<MarkdownContent html={editNotePreviewHtml} />{:else}<p class="preview-empty">Nothing to preview.</p>{/if}
                  </div>
                {/if}
              </div>
              <div class="form-actions">
                <Button variant="outlined" size="sm" onclick={() => noteDetailMode = 'view'}>Cancel</Button>
                <Button type="submit" size="sm" loading={savingEditNote}>Save</Button>
              </div>
            </form>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<DestructiveConfirmDialog
  open={!!deleteNoteTarget}
  title="Delete note?"
  message="This note will be permanently deleted."
  confirmPhrase={`I want to delete ${deleteNoteTarget?.title ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDeleteNote}
  oncancel={() => deleteNoteTarget = null}
/>

<DestructiveConfirmDialog
  open={deleteTranscriptionOpen}
  title="Delete recording?"
  message="This recording, its transcript, and all notes will be permanently deleted."
  confirmPhrase={`I want to delete ${transcription.name}`}
  confirmLabel="Delete"
  onconfirm={confirmDeleteTranscription}
  oncancel={() => deleteTranscriptionOpen = false}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .rec-date { font-size: 0.8125rem; color: var(--color-text-secondary); }
  .header-actions { display: flex; gap: 8px; flex-shrink: 0; }

  /* Cards */
  .card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 20px; margin-bottom: 16px;
  }
  .card-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 8px; }
  .card-title { font-size: 0.9375rem; font-weight: 500; margin: 0; }

  /* Transcript toggle */
  .transcript-card { padding: 0; overflow: hidden; }
  .transcript-toggle {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 16px 20px; border: none; background: transparent; cursor: pointer;
    text-align: left; gap: 10px;
    transition: background var(--transition-standard);
  }
  .transcript-toggle:hover { background: var(--color-surface-1); }
  .toggle-left { display: flex; align-items: center; gap: 8px; color: var(--color-text-secondary); }
  .toggle-left .card-title { color: var(--color-text-primary); }
  .transcript-body { padding: 0 20px 20px; border-top: 1px solid var(--color-surface-2); }

  /* Status badge */
  .status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em;
    padding: 3px 9px; border-radius: 20px; text-transform: uppercase; flex-shrink: 0;
  }
  .status-pending   { background: var(--color-surface-2); color: var(--color-text-secondary); }
  .status-processing{ background: color-mix(in srgb, var(--color-info) 12%, transparent); color: var(--color-info); }
  .status-completed { background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success); }
  .status-failed    { background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); }

  /* Rec meta */
  .rec-meta { display: flex; flex-direction: column; gap: 2px; margin-bottom: 14px; }
  .rec-name { font-size: 1rem; font-weight: 500; }
  .rec-date-label { font-size: 0.8125rem; color: var(--color-text-secondary); }
  .rec-language { font-size: 0.8125rem; color: var(--color-text-disabled); }

  /* Retry form */
  .retry-form { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
  .retry-actions { display: flex; justify-content: flex-end; gap: 8px; }

  /* Meta edit form */
  .meta-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 14px; }
  .meta-actions { display: flex; justify-content: flex-end; gap: 8px; }

  /* Audio */
  .audio-error { font-size: 0.875rem; color: var(--color-error); margin: 0; }
  .audio-error-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .audio-empty { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; }
  .audio-player { width: 100%; border-radius: 6px; outline: none; }
  .audio-load-btn {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 12px 16px; border-radius: 8px; border: 1px dashed var(--color-surface-3);
    background: var(--color-surface-1); color: var(--color-text-secondary);
    font-size: 0.875rem; font-family: inherit; cursor: pointer;
    transition: background var(--transition-standard), border-color var(--transition-standard), color var(--transition-standard);
    text-overflow: ellipsis; overflow: hidden; white-space: nowrap;
  }
  .audio-load-btn:hover:not(:disabled) { background: var(--color-surface-2); border-color: var(--color-primary); color: var(--color-primary); }
  .audio-load-btn:disabled { cursor: not-allowed; opacity: 0.7; }
  .play-icon { flex-shrink: 0; }

  /* Transcript body */
  .transcript-msg { font-size: 0.875rem; margin: 16px 0 4px; }
  .transcript-msg.muted { color: var(--color-text-secondary); }
  .transcript-msg.error { color: var(--color-error); }
  .transcript-processing { display: flex; align-items: center; gap: 10px; font-size: 0.875rem; color: var(--color-text-secondary); padding-top: 16px; }
  .transcript-text {
    white-space: pre-wrap; word-break: break-word; font-family: inherit;
    font-size: 0.875rem; line-height: 1.7; color: var(--color-text-primary);
    margin: 16px 0 0; padding: 14px; background: var(--color-surface-1); border-radius: 8px;
    max-height: 520px; overflow-y: auto;
  }

  /* Notes */
  .notes-card { margin-bottom: 0; }
  .notes-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 8px; flex-wrap: wrap; }
  .notes-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .generation-overlay {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 32px 16px; text-align: center;
    background: var(--color-surface-1); border-radius: 8px;
    font-size: 0.9375rem; color: var(--color-text-secondary);
  }
  .generation-hint { font-size: 0.8125rem; color: var(--color-text-disabled); margin: 0; }

  .inline-error {
    padding: 10px 14px; background: color-mix(in srgb, var(--color-error) 8%, transparent);
    color: var(--color-error); border-radius: 6px; font-size: 0.875rem; margin-bottom: 14px;
  }

  /* Create form */
  .note-form-wrap { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--color-surface-2); }
  .note-form { display: flex; flex-direction: column; gap: 14px; }

  /* Note list */
  .notes-empty { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; line-height: 1.6; }
  .note-list { display: flex; flex-direction: column; gap: 8px; }
  .note-card {
    display: block; width: 100%; text-align: left; cursor: pointer;
    background: var(--color-surface-1); border: 1px solid var(--color-surface-3);
    border-radius: 8px; padding: 12px 14px;
    transition: background var(--transition-standard), border-color var(--transition-standard);
  }
  .note-card:hover { background: var(--color-surface-2); }
  .note-card.selected {
    background: var(--color-primary-subtle);
    border-color: var(--color-primary);
  }
  .note-card-title { font-size: 0.9375rem; font-weight: 500; margin-bottom: 4px; }
  .note-preview { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 6px; line-height: 1.5; }
  .note-date { font-size: 0.75rem; color: var(--color-text-disabled); }

  /* Inline note detail */
  .note-detail {
    margin-top: 12px; border-top: 2px solid var(--color-primary);
    padding-top: 16px;
  }
  .note-detail-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .note-detail-title { margin: 0; font-size: 1.125rem; font-weight: 500; line-height: 1.3; }
  .note-detail-actions { display: flex; gap: 4px; flex-shrink: 0; }
  .note-detail-body { font-size: 0.9375rem; line-height: 1.75; }

  /* Note edit form */
  .note-edit-form { display: flex; flex-direction: column; gap: 14px; }

  /* Shared form actions */
  .form-actions { display: flex; justify-content: flex-end; gap: 8px; }

  /* Markdown editor */
  .editor-section { display: flex; flex-direction: column; border: 1px solid var(--color-surface-3); border-radius: 8px; overflow: hidden; }
  .editor-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 12px; background: var(--color-surface-1); border-bottom: 1px solid var(--color-surface-3);
  }
  .toolbar-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
  .err { color: var(--color-error); font-weight: 400; }
  .mode-toggle { display: flex; gap: 2px; background: var(--color-surface-2); border-radius: 6px; padding: 2px; }
  .mode-btn {
    display: flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px;
    border: none; background: transparent; font-size: 0.75rem; cursor: pointer;
    color: var(--color-text-secondary); transition: all var(--transition-standard);
  }
  .mode-btn.active { background: var(--color-surface-0); color: var(--color-text-primary); box-shadow: var(--shadow-1); }
  .md-editor {
    width: 100%; min-height: 200px; padding: 14px; border: none; outline: none; resize: vertical;
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 0.875rem; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; line-height: 1.7;
    box-sizing: border-box;
  }
  .md-editor.has-error { background: color-mix(in srgb, var(--color-error) 4%, var(--color-surface-0)); }
  .md-preview { min-height: 200px; padding: 16px 18px; background: var(--color-surface-0); font-size: 0.9375rem; line-height: 1.75; overflow-x: auto; }
  .preview-empty { color: var(--color-text-disabled); font-style: italic; }

  /* Icon buttons */
  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  @media (max-width: 1019px) {
    .page { max-width: 100%; }
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .card { padding: 14px 12px; }
    .transcript-toggle { padding: 14px 12px; }
    .transcript-body { padding: 0 12px 14px; }
    .transcript-text { max-height: 320px; }
    .md-editor { min-height: 160px; }
    .md-preview { min-height: 160px; }
  }
</style>
