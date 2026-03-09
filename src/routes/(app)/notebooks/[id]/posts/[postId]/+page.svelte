<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { notebooksApi } from '$lib/api/notebooks'
  import { papersApi } from '$lib/api/papers'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { PostAttachment } from '$lib/types/notebook'
  import type { Paper } from '$lib/types/paper'
  import Button from '$lib/components/ui/Button.svelte'
  import FileUpload from '$lib/components/forms/FileUpload.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import { formatDate, formatBytes } from '$lib/utils/format'
  import { renderMarkdown } from '$lib/utils/markdown'
  import { Pencil, FileText, Paperclip, Download, Trash2, ExternalLink } from 'lucide-svelte'
  import { onMount } from 'svelte'

  let { data }: { data: PageData } = $props()
  let post = $derived(data.post)

  const notebookId = $derived(post.notebook_id)
  const activeAttachments = $derived(post.attachments.filter(a => !a.deleted))
  const renderedContent = $derived(renderMarkdown(post.content ?? ''))

  let uploadingFile       = $state(false)
  let deleteAttachTarget  = $state<PostAttachment | null>(null)

  let linkedPapers = $state<Paper[]>([])

  onMount(async () => {
    if (post.paper_ids?.length) {
      const results = await Promise.allSettled(
        post.paper_ids.map(id => papersApi.get(id))
      )
      linkedPapers = results
        .filter((r): r is PromiseFulfilledResult<Paper> => r.status === 'fulfilled')
        .map(r => r.value)
    }
  })

  async function uploadFile(file: File) {
    uploadingFile = true
    try {
      await notebooksApi.uploadPostAttachment(notebookId, post.id, file)
      toast.success(`${file.name} uploaded`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Upload failed')
    } finally {
      uploadingFile = false
    }
  }

  async function downloadAttachment(attach: PostAttachment) {
    try {
      const url = await notebooksApi.getPostAttachmentUrl(notebookId, post.id, attach.id)
      window.open(url, '_blank')
    } catch {
      toast.error('Failed to download file')
    }
  }

  async function confirmDeleteAttachment() {
    if (!deleteAttachTarget) return
    try {
      await notebooksApi.deletePostAttachment(notebookId, post.id, deleteAttachTarget.id)
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
      <a href="/notebooks/{notebookId}" class="back-link">← Notebook</a>
      <div class="title-row">
        <h1 class:deleted-text={post.deleted}>{post.title}</h1>
        {#if post.deleted}<span class="deleted-badge">deleted</span>{/if}
      </div>
      <span class="post-date">
        Created {formatDate(post.created_at)}
        {#if post.updated_at !== post.created_at} · Updated {formatDate(post.updated_at)}{/if}
      </span>
    </div>
    {#if !post.deleted}
      <Button variant="outlined" size="sm" onclick={() => goto(`/notebooks/${notebookId}/posts/${post.id}/edit`)}>
        <Pencil size={18} /><span class="btn-label"> Edit</span>
      </Button>
    {/if}
  </div>

  <div class="layout">
    <!-- Left: content -->
    <div class="main-col">
      <div class="card">
        <div class="md-content prose">
          {@html renderedContent}
        </div>
      </div>

      <!-- Attachments -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Attachments</h2>
          {#if !post.deleted}
            <FileUpload onfile={uploadFile} loading={uploadingFile} />
          {/if}
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
                  <button class="icon-btn" title="Download" onclick={() => downloadAttachment(attach)}><Download size={18} /></button>
                  {#if !post.deleted}
                    <button class="icon-btn danger" title="Delete" onclick={() => deleteAttachTarget = attach}><Trash2 size={18} /></button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <!-- Right: linked papers -->
    {#if post.paper_ids?.length}
      <div class="sidebar-col">
        <div class="card">
          <h2 class="card-title">Linked Papers</h2>
          <ul class="paper-list">
            {#if linkedPapers.length > 0}
              {#each linkedPapers as paper}
                <li class="paper-item">
                  <FileText size={16} />
                  <div class="paper-info">
                    <a href="/papers/{paper.id}" class="paper-link">{paper.title}</a>
                    <span class="paper-meta">{paper.year} · {paper.journal}</span>
                  </div>
                  <a href="/papers/{paper.id}" target="_blank" rel="noreferrer" class="icon-btn" title="Open paper">
                    <ExternalLink size={16} />
                  </a>
                </li>
              {/each}
            {:else}
              {#each post.paper_ids as pid}
                <li class="paper-item muted">
                  <FileText size={16} />
                  <span class="paper-id">{pid}</span>
                </li>
              {/each}
            {/if}
          </ul>
        </div>
      </div>
    {/if}
  </div>
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
  .page { max-width: 100%; overflow-x: hidden; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
  .title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .post-date { font-size: 0.8125rem; color: var(--color-text-secondary); }
  .deleted-text { text-decoration: line-through; color: var(--color-text-disabled); }
  .deleted-badge {
    display: inline-block; padding: 1px 6px; border-radius: 10px;
    font-size: 0.6875rem; background: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error); font-weight: 500;
  }

  .layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }
  @media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } }

  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; padding: 20px; margin-bottom: 16px; }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .card-title { font-size: 0.9375rem; font-weight: 500; margin: 0 0 16px; }
  .card-header .card-title { margin: 0; }

  /* Markdown content */
  .md-content { font-size: 0.9375rem; line-height: 1.75; }
  .md-content :global(h1), .md-content :global(h2), .md-content :global(h3), .md-content :global(h4) {
    font-weight: 600; line-height: 1.3; margin: 1.25em 0 0.5em;
    color: var(--color-text-primary);
  }
  .md-content :global(h1) { font-size: 1.5rem; }
  .md-content :global(h2) { font-size: 1.25rem; border-bottom: 1px solid var(--color-surface-3); padding-bottom: 4px; }
  .md-content :global(h3) { font-size: 1.1rem; }
  .md-content :global(p) { margin: 0.75em 0; color: var(--color-text-primary); }
  .md-content :global(a) { color: var(--color-primary); }
  .md-content :global(code) {
    background: var(--color-surface-2); padding: 1px 5px; border-radius: 4px;
    font-size: 0.85em; font-family: 'Menlo', 'Monaco', monospace;
  }
  .md-content :global(pre) {
    background: var(--color-surface-2); padding: 12px 16px; border-radius: 8px;
    overflow-x: auto; margin: 1em 0;
  }
  .md-content :global(pre) :global(code) { background: none; padding: 0; }
  .md-content :global(blockquote) {
    border-left: 3px solid var(--color-primary-subtle); padding-left: 12px;
    margin: 1em 0; color: var(--color-text-secondary); font-style: italic;
  }
  .md-content :global(ul), .md-content :global(ol) { padding-left: 1.5em; margin: 0.75em 0; }
  .md-content :global(li) { margin: 0.3em 0; }
  .md-content :global(table) { border-collapse: collapse; width: 100%; margin: 1em 0; }
  .md-content :global(th), .md-content :global(td) { border: 1px solid var(--color-surface-3); padding: 8px 12px; text-align: left; }
  .md-content :global(th) { background: var(--color-surface-1); font-weight: 500; }
  .md-content :global(hr) { border: none; border-top: 1px solid var(--color-surface-3); margin: 1.5em 0; }
  .md-content :global(.katex-display) { overflow-x: auto; padding: 8px 0; }

  /* Attachments */
  .attach-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .attach-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--color-surface-1); border-radius: 8px; color: var(--color-text-secondary); }
  .attach-info { flex: 1; min-width: 0; }
  .attach-name { font-size: 0.8125rem; color: var(--color-text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attach-size { font-size: 0.6875rem; color: var(--color-text-disabled); }
  .attach-actions { display: flex; gap: 4px; }

  /* Linked papers */
  .paper-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .paper-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px; background: var(--color-surface-1); border-radius: 8px; color: var(--color-text-secondary); }
  .paper-info { flex: 1; min-width: 0; }
  .paper-link { font-size: 0.8125rem; color: var(--color-primary); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .paper-link:hover { text-decoration: underline; }
  .paper-meta { font-size: 0.75rem; color: var(--color-text-disabled); }
  .paper-id { font-size: 0.75rem; color: var(--color-text-secondary); font-family: monospace; word-break: break-all; }
  .muted { opacity: 0.7; }

  .empty-msg { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard); text-decoration: none; flex-shrink: 0;
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .btn-label { display: none; }
    .card { padding: 14px 12px; }
  }
</style>
