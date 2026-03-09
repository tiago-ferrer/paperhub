<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { notebooksApi } from '$lib/api/notebooks'
  import { papersApi } from '$lib/api/papers'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Paper } from '$lib/types/paper'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'
  import { renderMarkdown } from '$lib/utils/markdown'
  import { onMount } from 'svelte'
  import { Eye, Pencil, FileText } from 'lucide-svelte'

  const notebookId = $page.params.id as string

  let title     = $state('')
  let content   = $state('')
  let saving    = $state(false)
  let errors    = $state<Record<string, string>>({})
  let mode      = $state<'edit' | 'preview'>('edit')

  let papers        = $state<Paper[]>([])
  let selectedPaperIds = $state<Set<string>>(new Set())
  let paperSearch   = $state('')
  let showPaperPicker = $state(false)

  const previewHtml = $derived(content ? renderMarkdown(content) : '')
  const filteredPapers = $derived(
    papers.filter(p => !p.deleted && p.title.toLowerCase().includes(paperSearch.toLowerCase()))
  )

  onMount(async () => {
    try {
      const res = await papersApi.list(0, 100)
      papers = res.items
    } catch { /* papers list is optional */ }
  })

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!content.trim()) e.content = 'Content is required'
    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    errors = validate()
    if (Object.keys(errors).length) return

    saving = true
    try {
      const post = await notebooksApi.createPost(notebookId, {
        title: title.trim(),
        content: content.trim(),
        paperIds: selectedPaperIds.size > 0 ? [...selectedPaperIds] : undefined,
      })
      toast.success('Post created')
      goto(`/notebooks/${notebookId}/posts/${post.id}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create post')
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
</script>

<div class="page">
  <div class="page-header">
    <a href="/notebooks/{notebookId}" class="back-link">← Notebook</a>
    <h1>New Post</h1>
  </div>

  <form onsubmit={submit} class="form">
    <FormField label="Title" required error={errors.title}>
      <input type="text" bind:value={title} placeholder="Post title…" />
    </FormField>

    <!-- Editor / Preview toggle -->
    <div class="editor-section">
      <div class="editor-toolbar">
        <span class="toolbar-label">Content {#if errors.content}<span class="err"> — {errors.content}</span>{/if}</span>
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
          <input
            type="text"
            class="paper-search"
            bind:value={paperSearch}
            placeholder="Search papers…"
          />
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

    <div class="form-actions">
      <Button variant="outlined" onclick={() => goto(`/notebooks/${notebookId}`)}>Cancel</Button>
      <Button type="submit" loading={saving}>Create Post</Button>
    </div>
  </form>
</div>

<style>
  .page { max-width: 100%; }
  .page-header { margin-bottom: 24px; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; display: block; margin-bottom: 8px; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; }

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
  .md-preview {
    min-height: 420px; padding: 20px 24px; background: var(--color-surface-0);
    font-size: 0.9375rem; line-height: 1.75; overflow-x: auto;
  }
  .preview-empty { color: var(--color-text-disabled); font-style: italic; }

  /* Prose (markdown) styles */
  .prose :global(h1), .prose :global(h2), .prose :global(h3), .prose :global(h4) {
    font-weight: 600; line-height: 1.3; margin: 1.25em 0 0.5em;
    color: var(--color-text-primary);
  }
  .prose :global(h1) { font-size: 1.5rem; }
  .prose :global(h2) { font-size: 1.25rem; }
  .prose :global(h3) { font-size: 1.1rem; }
  .prose :global(p) { margin: 0.75em 0; color: var(--color-text-primary); }
  .prose :global(a) { color: var(--color-primary); }
  .prose :global(code) {
    background: var(--color-surface-2); padding: 1px 5px; border-radius: 4px;
    font-size: 0.85em; font-family: 'Menlo', 'Monaco', monospace;
  }
  .prose :global(pre) {
    background: var(--color-surface-2); padding: 12px 16px; border-radius: 8px;
    overflow-x: auto; margin: 1em 0;
  }
  .prose :global(pre) :global(code) { background: none; padding: 0; }
  .prose :global(blockquote) {
    border-left: 3px solid var(--color-primary-subtle); padding-left: 12px;
    margin: 1em 0; color: var(--color-text-secondary); font-style: italic;
  }
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
  .toggle-picker {
    font-size: 0.8125rem; color: var(--color-primary); background: none; border: none; cursor: pointer; padding: 0;
  }
  .toggle-picker:hover { text-decoration: underline; }

  .selected-papers { display: flex; flex-wrap: wrap; gap: 6px; }
  .paper-chip {
    display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px;
    font-size: 0.8125rem; background: var(--color-primary-subtle); color: var(--color-primary);
    max-width: 260px;
  }
  .paper-chip :global(svg) { flex-shrink: 0; }
  .remove-chip { background: none; border: none; cursor: pointer; color: inherit; font-size: 1rem; line-height: 1; padding: 0 0 0 2px; }

  .paper-picker { border: 1px solid var(--color-surface-3); border-radius: 8px; overflow: hidden; }
  .paper-search {
    width: 100%; padding: 8px 12px; border: none; border-bottom: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary); font-size: 0.875rem; outline: none;
    box-sizing: border-box;
  }
  .paper-list { list-style: none; padding: 0; margin: 0; max-height: 220px; overflow-y: auto; }
  .paper-option {
    display: flex; align-items: center; gap: 10px; padding: 8px 12px; cursor: pointer;
    transition: background var(--transition-standard);
  }
  .paper-option:hover { background: var(--color-surface-1); }
  .paper-option.selected { background: var(--color-primary-subtle); }
  .paper-option input { accent-color: var(--color-primary); flex-shrink: 0; }
  .paper-option-title { flex: 1; font-size: 0.875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .paper-option-year { font-size: 0.75rem; color: var(--color-text-secondary); flex-shrink: 0; }
  .no-papers { padding: 12px; font-size: 0.875rem; color: var(--color-text-secondary); text-align: center; }

  .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }

  @media (max-width: 1019px) {
    .md-editor { min-height: 300px; padding: 12px; font-size: 0.8125rem; }
    .md-preview { min-height: 300px; padding: 14px; }
    .form-actions { flex-wrap: wrap; }
    .form-actions :global(button), .form-actions :global(a) { flex: 1; }
  }
</style>
