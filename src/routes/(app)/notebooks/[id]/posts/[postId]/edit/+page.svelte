<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { notebooksApi } from '$lib/api/notebooks'
  import { papersApi } from '$lib/api/papers'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { NotebookPost } from '$lib/types/notebook'
  import type { Paper } from '$lib/types/paper'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import FileUpload from '$lib/components/forms/FileUpload.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { renderMarkdown } from '$lib/utils/markdown'
  import { formatBytes } from '$lib/utils/format'
  import { onMount } from 'svelte'
  import { Eye, Pencil, FileText, Paperclip, Trash2, Download } from 'lucide-svelte'

  const notebookId = $page.params.id as string
  const postId     = $page.params.postId as string

  let original = $state<NotebookPost | null>(null)
  let loading  = $state(true)
  let saving   = $state(false)
  let errors   = $state<Record<string, string>>({})
  let mode     = $state<'edit' | 'preview'>('edit')

  let title   = $state('')
  let content = $state('')

  let papers           = $state<Paper[]>([])
  let selectedPaperIds = $state<Set<string>>(new Set())
  let paperSearch      = $state('')
  let showPaperPicker  = $state(false)

  let uploadingFile      = $state(false)
  let deleteAttachTarget = $state<{ id: string; filename: string } | null>(null)

  const previewHtml     = $derived(content ? renderMarkdown(content) : '')
  const filteredPapers  = $derived(papers.filter(p => !p.deleted && p.title.toLowerCase().includes(paperSearch.toLowerCase())))
  const activeAttachments = $derived((original?.attachments ?? []).filter(a => !a.deleted))

  onMount(async () => {
    try {
      const [post, papersRes] = await Promise.all([
        notebooksApi.getPost(notebookId, postId),
        papersApi.list(0, 100),
      ])
      original = post
      title    = post.title
      content  = post.content ?? ''
      selectedPaperIds = new Set(post.paper_ids ?? [])
      papers   = papersRes.items
    } catch {
      toast.error('Failed to load post')
      goto(`/notebooks/${notebookId}`)
    } finally {
      loading = false
    }
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!content.trim()) e.content = 'Content is required'
    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    if (!original) return
    errors = validate()
    if (Object.keys(errors).length) return

    const patch: Record<string, unknown> = {}
    if (title.trim() !== original.title) patch.title = title.trim()
    if (content.trim() !== (original.content ?? '')) patch.content = content.trim()

    const origIds = JSON.stringify([...(original.paper_ids ?? [])].sort())
    const currIds = JSON.stringify([...selectedPaperIds].sort())
    if (origIds !== currIds) patch.paperIds = [...selectedPaperIds]

    if (!Object.keys(patch).length) {
      toast.info('No changes to save')
      return
    }

    saving = true
    try {
      await notebooksApi.patchPost(notebookId, postId, patch)
      toast.success('Post updated')
      await invalidateAll()
      goto(`/notebooks/${notebookId}/posts/${postId}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update post')
    } finally {
      saving = false
    }
  }

  function togglePaper(id: string) {
    const next = new Set(selectedPaperIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedPaperIds = next
  }

  function getPaperTitle(id: string) {
    return papers.find(p => p.id === id)?.title ?? id
  }

  async function uploadFile(file: File) {
    uploadingFile = true
    try {
      await notebooksApi.uploadPostAttachment(notebookId, postId, file)
      toast.success(`${file.name} uploaded`)
      // Reload post to refresh attachments list
      original = await notebooksApi.getPost(notebookId, postId)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed')
    } finally {
      uploadingFile = false
    }
  }

  async function downloadAttachment(id: string) {
    try {
      const url = await notebooksApi.getPostAttachmentUrl(notebookId, postId, id)
      window.open(url, '_blank')
    } catch {
      toast.error('Failed to download file')
    }
  }

  async function confirmDeleteAttachment() {
    if (!deleteAttachTarget) return
    try {
      await notebooksApi.deletePostAttachment(notebookId, postId, deleteAttachTarget.id)
      toast.success('Attachment deleted')
      deleteAttachTarget = null
      original = await notebooksApi.getPost(notebookId, postId)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete attachment')
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <a href="/notebooks/{notebookId}/posts/{postId}" class="back-link">← Post</a>
    <h1>Edit Post</h1>
  </div>

  {#if loading}
    <div class="loading"><Spinner size={41} /></div>
  {:else}
    <form onsubmit={submit} class="form">
      <FormField label="Title" required error={errors.title}>
        <input type="text" bind:value={title} />
      </FormField>

      <!-- Editor / Preview -->
      <div class="editor-section">
        <div class="editor-toolbar">
          <span class="toolbar-label">Content {#if errors.content}<span class="err">— {errors.content}</span>{/if}</span>
          <div class="mode-toggle">
            <button type="button" class="mode-btn" class:active={mode === 'edit'} onclick={() => mode = 'edit'}>
              <Pencil size={14} /> Edit
            </button>
            <button type="button" class="mode-btn" class:active={mode === 'preview'} onclick={() => mode = 'preview'}>
              <Eye size={14} /> Preview
            </button>
          </div>
        </div>

        {#if mode === 'edit'}
          <textarea
            bind:value={content}
            class="md-editor"
            class:has-error={!!errors.content}
            rows={20}
            placeholder="Write in Markdown… Use $math$ for inline and $$math$$ for block math."
          ></textarea>
        {:else}
          <div class="md-preview prose">
            {#if previewHtml}
              {@html previewHtml}
            {:else}
              <p class="preview-empty">Nothing to preview yet.</p>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Paper association -->
      <div class="paper-section">
        <div class="section-header">
          <span class="section-label">Associated Papers</span>
          <button type="button" class="toggle-picker" onclick={() => showPaperPicker = !showPaperPicker}>
            {showPaperPicker ? 'Done' : 'Select papers'}
          </button>
        </div>

        {#if selectedPaperIds.size > 0}
          <div class="selected-papers">
            {#each [...selectedPaperIds] as pid}
              <span class="paper-chip">
                <FileText size={12} />
                {getPaperTitle(pid)}
                <button type="button" class="remove-chip" onclick={() => togglePaper(pid)}>×</button>
              </span>
            {/each}
          </div>
        {/if}

        {#if showPaperPicker && papers.length > 0}
          <div class="paper-picker">
            <input type="text" class="paper-search" bind:value={paperSearch} placeholder="Search papers…" />
            <ul class="paper-list">
              {#each filteredPapers.slice(0, 30) as paper}
                <li>
                  <label class="paper-option" class:selected={selectedPaperIds.has(paper.id)}>
                    <input type="checkbox" checked={selectedPaperIds.has(paper.id)} onchange={() => togglePaper(paper.id)} />
                    <span class="paper-option-title">{paper.title}</span>
                    <span class="paper-option-year">{paper.year}</span>
                  </label>
                </li>
              {/each}
              {#if filteredPapers.length === 0}
                <li class="no-papers">No papers found</li>
              {/if}
            </ul>
          </div>
        {/if}
      </div>

      <!-- Attachments -->
      <div class="attach-section">
        <div class="section-header">
          <span class="section-label">Attachments</span>
          <FileUpload onfile={uploadFile} loading={uploadingFile} />
        </div>
        {#if activeAttachments.length === 0}
          <p class="empty-msg">No attachments</p>
        {:else}
          <ul class="attach-list">
            {#each activeAttachments as attach}
              <li class="attach-item">
                <Paperclip size={18} />
                <div class="attach-info">
                  <span class="attach-name">{attach.filename}</span>
                  <span class="attach-size">{formatBytes(attach.size_bytes)}</span>
                </div>
                <div class="attach-actions">
                  <button type="button" class="icon-btn" title="Download" onclick={() => downloadAttachment(attach.id)}><Download size={18} /></button>
                  <button type="button" class="icon-btn danger" title="Delete" onclick={() => deleteAttachTarget = attach}><Trash2 size={18} /></button>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="form-actions">
        <Button variant="outlined" onclick={() => goto(`/notebooks/${notebookId}/posts/${postId}`)}>Cancel</Button>
        <Button type="submit" loading={saving}>Save Changes</Button>
      </div>
    </form>
  {/if}
</div>

<ConfirmDialog
  open={!!deleteAttachTarget}
  title="Delete attachment?"
  message="This file will be removed from the post."
  confirmLabel="Delete"
  onconfirm={confirmDeleteAttachment}
  oncancel={() => deleteAttachTarget = null}
/>

<style>
  .page { max-width: 900px; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; }
  .loading { display: flex; justify-content: center; padding: 80px; }

  .form { display: flex; flex-direction: column; gap: 20px; }

  /* Editor */
  .editor-section { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--color-surface-3); border-radius: 8px; overflow: hidden; }
  .editor-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; background: var(--color-surface-1); border-bottom: 1px solid var(--color-surface-3);
  }
  .toolbar-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
  .err { color: var(--color-error); font-weight: 400; }

  .mode-toggle { display: flex; gap: 2px; background: var(--color-surface-2); border-radius: 6px; padding: 2px; }
  .mode-btn {
    display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 4px;
    border: none; background: transparent; font-size: 0.8125rem; cursor: pointer;
    color: var(--color-text-secondary); transition: all var(--transition-standard);
  }
  .mode-btn.active { background: var(--color-surface-0); color: var(--color-text-primary); box-shadow: var(--shadow-1); }

  .md-editor {
    width: 100%; min-height: 420px; padding: 16px; border: none; outline: none; resize: vertical;
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 0.875rem; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; line-height: 1.7;
    box-sizing: border-box;
  }
  .md-editor.has-error { background: color-mix(in srgb, var(--color-error) 4%, var(--color-surface-0)); }
  .md-preview { min-height: 420px; padding: 20px 24px; background: var(--color-surface-0); font-size: 0.9375rem; line-height: 1.75; overflow-x: auto; }
  .preview-empty { color: var(--color-text-disabled); font-style: italic; }

  .prose :global(h1), .prose :global(h2), .prose :global(h3), .prose :global(h4) {
    font-weight: 600; line-height: 1.3; margin: 1.25em 0 0.5em; color: var(--color-text-primary);
  }
  .prose :global(h1) { font-size: 1.5rem; }
  .prose :global(h2) { font-size: 1.25rem; }
  .prose :global(h3) { font-size: 1.1rem; }
  .prose :global(p) { margin: 0.75em 0; color: var(--color-text-primary); }
  .prose :global(a) { color: var(--color-primary); }
  .prose :global(code) { background: var(--color-surface-2); padding: 1px 5px; border-radius: 4px; font-size: 0.85em; font-family: 'Menlo', 'Monaco', monospace; }
  .prose :global(pre) { background: var(--color-surface-2); padding: 12px 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
  .prose :global(pre) :global(code) { background: none; padding: 0; }
  .prose :global(blockquote) { border-left: 3px solid var(--color-primary-subtle); padding-left: 12px; margin: 1em 0; color: var(--color-text-secondary); font-style: italic; }
  .prose :global(ul), .prose :global(ol) { padding-left: 1.5em; margin: 0.75em 0; }
  .prose :global(li) { margin: 0.3em 0; }
  .prose :global(table) { border-collapse: collapse; width: 100%; margin: 1em 0; }
  .prose :global(th), .prose :global(td) { border: 1px solid var(--color-surface-3); padding: 8px 12px; text-align: left; }
  .prose :global(th) { background: var(--color-surface-1); font-weight: 500; }
  .prose :global(.katex-display) { overflow-x: auto; padding: 8px 0; }

  /* Paper picker */
  .paper-section { display: flex; flex-direction: column; gap: 10px; }
  .section-header { display: flex; align-items: center; justify-content: space-between; }
  .section-label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); }
  .toggle-picker { font-size: 0.8125rem; color: var(--color-primary); background: none; border: none; cursor: pointer; padding: 0; }
  .toggle-picker:hover { text-decoration: underline; }

  .selected-papers { display: flex; flex-wrap: wrap; gap: 6px; }
  .paper-chip {
    display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px;
    font-size: 0.8125rem; background: var(--color-primary-subtle); color: var(--color-primary);
    max-width: 260px;
  }
  .remove-chip { background: none; border: none; cursor: pointer; color: inherit; font-size: 1rem; line-height: 1; padding: 0 0 0 2px; }

  .paper-picker { border: 1px solid var(--color-surface-3); border-radius: 8px; overflow: hidden; }
  .paper-search { width: 100%; padding: 8px 12px; border: none; border-bottom: 1px solid var(--color-surface-3); background: var(--color-surface-0); color: var(--color-text-primary); font-size: 0.875rem; outline: none; box-sizing: border-box; }
  .paper-list { list-style: none; padding: 0; margin: 0; max-height: 220px; overflow-y: auto; }
  .paper-option { display: flex; align-items: center; gap: 10px; padding: 8px 12px; cursor: pointer; transition: background var(--transition-standard); }
  .paper-option:hover { background: var(--color-surface-1); }
  .paper-option.selected { background: var(--color-primary-subtle); }
  .paper-option input { accent-color: var(--color-primary); flex-shrink: 0; }
  .paper-option-title { flex: 1; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .paper-option-year { font-size: 0.75rem; color: var(--color-text-secondary); flex-shrink: 0; }
  .no-papers { padding: 12px; font-size: 0.875rem; color: var(--color-text-secondary); text-align: center; }

  /* Attachments */
  .attach-section { display: flex; flex-direction: column; gap: 10px; }
  .attach-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .attach-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--color-surface-1); border-radius: 8px; color: var(--color-text-secondary); }
  .attach-info { flex: 1; min-width: 0; }
  .attach-name { font-size: 0.8125rem; color: var(--color-text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attach-size { font-size: 0.6875rem; color: var(--color-text-disabled); }
  .attach-actions { display: flex; gap: 4px; }
  .empty-msg { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; }

  .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }

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
    .md-editor { min-height: 300px; }
    .md-preview { min-height: 300px; padding: 14px; }
  }
</style>
