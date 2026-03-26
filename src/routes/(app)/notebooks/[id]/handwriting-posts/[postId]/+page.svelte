<script lang="ts">
  import type { PageData } from './$types'
  import { notebooksApi } from '$lib/api/notebooks'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Reference } from '$lib/types/reference'
  import { formatDate } from '$lib/utils/format'
  import { FileText, ExternalLink, Eye } from 'lucide-svelte'
  import { onMount } from 'svelte'

  let { data }: { data: PageData } = $props()
  let post = $derived(data.handwritingPost)
  let notebookId = $derived(post.notebook_id)

  let pdfUrl = $state<string | null>(null)
  let pdfFetchedAt = $state<number | null>(null)
  let loadingPdf = $state(false)
  let pdfColEl = $state<HTMLElement | null>(null)

  let linkedPapers = $state<Reference[]>([])

  $effect(() => {
    if (pdfUrl && pdfColEl) {
      pdfColEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })

  onMount(async () => {
    if (post.paper_ids?.length) {
      const results = await Promise.allSettled(
        post.paper_ids.map(id => referencesApi.get(id))
      )
      linkedPapers = results
        .filter((r): r is PromiseFulfilledResult<Reference> => r.status === 'fulfilled')
        .map(r => r.value)
    }

    if (post.pdf_s3_key) {
      await loadPdf()
    }
  })

  async function loadPdf() {
    loadingPdf = true
    try {
      pdfUrl = await notebooksApi.getHandwritingPostPdfUrl(notebookId, post.id)
      pdfFetchedAt = Date.now()
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = '/login'
      } else if (e instanceof ApiError && e.status === 400) {
        toast.error('No PDF available for this post.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } finally {
      loadingPdf = false
    }
  }

  async function refreshIfExpired() {
    if (!pdfFetchedAt || Date.now() - pdfFetchedAt > 55 * 60 * 1000) {
      await loadPdf()
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
  </div>

  {#if post.paper_ids?.length}
    <div class="card papers-card">
      <h2 class="card-title">Linked Papers</h2>
      <ul class="paper-list">
        {#if linkedPapers.length > 0}
          {#each linkedPapers as paper}
            <li class="paper-item">
              <FileText size={16} />
              <div class="paper-info">
                <a href="/references/{paper.id}" class="paper-link">{paper.title}</a>
                <span class="paper-meta">{paper.year} · {paper.journal}</span>
              </div>
              <a href="/references/{paper.id}" target="_blank" rel="noreferrer" class="icon-btn" title="Open reference">
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
  {/if}

  {#if !post.pdf_s3_key}
    <div class="card">
      <p class="no-file">No PDF attached to this post.</p>
    </div>
  {:else}
    <div class="card pdf-card" bind:this={pdfColEl}>
      {#if pdfUrl}
        <a href={pdfUrl} target="_blank" rel="noopener" class="pdf-open-btn" onclick={refreshIfExpired}>Open in browser</a>
        <div class="pdf-scroll-wrap">
          <iframe src={pdfUrl} title="PDF Viewer" class="pdf-iframe"></iframe>
        </div>
      {:else if loadingPdf}
        <div class="pdf-empty">
          <p>Loading PDF…</p>
        </div>
      {:else}
        <div class="pdf-empty">
          <Eye size={40} />
          <p>No PDF to display</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .page { max-width: 100%; overflow-x: hidden; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
  .title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .post-date { font-size: 0.8125rem; color: var(--color-text-secondary); }
  .deleted-text { text-decoration: line-through; color: var(--color-text-disabled); }
  .deleted-badge {
    display: inline-block; padding: 1px 6px; border-radius: 10px;
    font-size: 0.6875rem; background: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error); font-weight: 500;
  }

  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 10px; padding: 20px; margin-bottom: 16px; width: 100%; box-sizing: border-box; }
  .card-title { font-size: 0.9375rem; font-weight: 500; margin: 0 0 16px; }
  .papers-card { margin-bottom: 16px; }

  .no-file { font-size: 0.875rem; color: var(--color-text-disabled); margin: 0; }

  /* Linked papers */
  .paper-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .paper-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px; background: var(--color-surface-1); border-radius: 8px; color: var(--color-text-secondary); }
  .paper-info { flex: 1; min-width: 0; }
  .paper-link { font-size: 0.8125rem; color: var(--color-primary); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .paper-link:hover { text-decoration: underline; }
  .paper-meta { font-size: 0.75rem; color: var(--color-text-disabled); }
  .paper-id { font-size: 0.75rem; color: var(--color-text-secondary); font-family: monospace; word-break: break-all; }
  .muted { opacity: 0.7; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard); text-decoration: none; flex-shrink: 0;
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

  /* PDF viewer */
  .pdf-card { display: flex; flex-direction: column; }
  .pdf-open-btn {
    display: none; margin-bottom: 10px;
    padding: 10px 16px; border-radius: 8px; text-align: center;
    background: var(--color-primary); color: white; text-decoration: none;
    font-size: 0.875rem; font-weight: 500;
  }
  @media (max-width: 1019px) { .pdf-open-btn { display: block; } }

  .pdf-scroll-wrap {
    width: 100%; height: calc(100vh - 220px); min-height: 400px;
    overflow: auto; -webkit-overflow-scrolling: touch; border-radius: 6px;
  }
  .pdf-iframe { width: 100%; height: 100%; border: none; display: block; }
  .pdf-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; height: 300px; color: var(--color-text-disabled);
    background: var(--color-surface-1); border-radius: 6px;
  }
  .pdf-empty p { font-size: 0.875rem; margin: 0; }

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .card { padding: 14px 12px; }
    .pdf-scroll-wrap { height: 70vh; min-height: 280px; }
  }
</style>
