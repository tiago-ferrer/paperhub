<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { notebooksApi } from '$lib/api/notebooks'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { NotebookPost } from '$lib/types/notebook'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import Pagination from '$lib/components/data/Pagination.svelte'
  import { formatDate } from '$lib/utils/format'
  import { stripMarkdown } from '$lib/utils/markdown'
  import { Plus, Pencil, Trash2, FileText, Paperclip } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()
  let nb = $derived(data.notebook)

  let deleteTarget = $state<NotebookPost | null>(null)
  let deleting = $state(false)

  function toggleDeleted() {
    const p = new URLSearchParams()
    if (!data.includeDeleted) p.set('includeDeleted', 'true')
    goto(`/notebooks/${nb.id}?${p}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    deleting = true
    try {
      await notebooksApi.removePost(nb.id, deleteTarget.id)
      toast.success('Post deleted')
      deleteTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete post')
    } finally {
      deleting = false
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <div class="header-left">
      <a href="/notebooks" class="back-link">← Notebooks</a>
      <div class="title-row">
        <h1>{nb.title}</h1>
        {#if nb.deleted}<span class="deleted-badge">deleted</span>{/if}
      </div>
      {#if nb.description}<p class="nb-desc">{nb.description}</p>{/if}
    </div>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>
        Show deleted
      </button>
      {#if !nb.deleted}
        <Button variant="outlined" size="sm" onclick={() => goto(`/notebooks/${nb.id}/edit`)}>
          <Pencil size={18} /><span class="btn-label"> Edit</span>
        </Button>
        <Button size="sm" onclick={() => goto(`/notebooks/${nb.id}/posts/new`)}>
          <Plus size={18} /><span class="btn-label"> New Post</span>
        </Button>
      {/if}
    </div>
  </div>

  {#if data.posts.items.length === 0}
    <EmptyState title="No posts yet" message="Write your first post in this notebook." />
  {:else}
    <div class="post-list">
      {#each data.posts.items as post}
        <div class="post-card" class:deleted-card={post.deleted} onclick={() => !post.deleted && goto(`/notebooks/${nb.id}/posts/${post.id}`)}>
          <div class="post-header">
            <div class="post-title-row">
              <span class="post-title" class:deleted-text={post.deleted}>{post.title}</span>
              {#if post.deleted}<span class="deleted-badge">deleted</span>{/if}
            </div>
            <div class="post-actions" onclick={(e) => e.stopPropagation()}>
              {#if !post.deleted}
                <button class="icon-btn" title="Edit" onclick={() => goto(`/notebooks/${nb.id}/posts/${post.id}/edit`)}>
                  <Pencil size={18} />
                </button>
                <button class="icon-btn danger" title="Delete" onclick={() => deleteTarget = post}>
                  <Trash2 size={18} />
                </button>
              {/if}
            </div>
          </div>
          {#if post.content}
            <p class="post-preview">{stripMarkdown(post.content, 180)}</p>
          {/if}
          <div class="post-footer">
            <span class="post-date">{formatDate(post.updated_at)}</span>
            <div class="post-meta">
              {#if post.paper_ids?.length}
                <span class="meta-chip"><FileText size={13} /> {post.paper_ids.length} paper{post.paper_ids.length !== 1 ? 's' : ''}</span>
              {/if}
              {#if post.attachments?.filter(a => !a.deleted).length}
                <span class="meta-chip"><Paperclip size={13} /> {post.attachments.filter(a => !a.deleted).length} file{post.attachments.filter(a => !a.deleted).length !== 1 ? 's' : ''}</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <Pagination
      page={data.postsPage}
      hasNext={!!data.posts.next_token}
      nextToken={data.posts.next_token}
      onprev={() => {
        const p = new URLSearchParams({ page: String(Math.max(0, data.postsPage - 1)) })
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/notebooks/${nb.id}?${p}`)
      }}
      onnext={() => {
        const p = new URLSearchParams({ page: String(data.postsPage + 1) })
        if (data.posts.next_token) p.set('next_token', data.posts.next_token)
        if (data.includeDeleted) p.set('includeDeleted', 'true')
        goto(`/notebooks/${nb.id}?${p}`)
      }}
    />
  {/if}
</div>

<ConfirmDialog
  open={!!deleteTarget}
  title="Delete post?"
  message="This post will be soft-deleted."
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
  .header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
  .title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .nb-desc { margin: 4px 0 0; font-size: 0.875rem; color: var(--color-text-secondary); }
  .header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  .deleted-badge {
    display: inline-block; padding: 1px 6px; border-radius: 10px;
    font-size: 0.6875rem; background: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error); font-weight: 500;
  }

  .post-list { display: flex; flex-direction: column; gap: 12px; }

  .post-card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 16px 20px; cursor: pointer;
    transition: background var(--transition-standard);
  }
  .post-card:hover:not(.deleted-card) { background: var(--color-surface-1); }
  .deleted-card { cursor: default; opacity: 0.6; }

  .post-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .post-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .post-title { font-size: 1rem; font-weight: 500; line-height: 1.4; }
  .deleted-text { text-decoration: line-through; color: var(--color-text-disabled); }
  .post-actions { display: flex; gap: 4px; flex-shrink: 0; }

  .post-preview { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 12px; line-height: 1.6; }

  .post-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .post-date { font-size: 0.75rem; color: var(--color-text-disabled); }
  .post-meta { display: flex; gap: 8px; }
  .meta-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.75rem; color: var(--color-text-secondary);
    padding: 2px 8px; background: var(--color-surface-2); border-radius: 10px;
  }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    .header-actions { width: 100%; justify-content: flex-end; }
    .btn-label { display: none; }
    .post-card { padding: 14px 16px; }
  }
</style>
