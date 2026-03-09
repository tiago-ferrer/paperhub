<script lang="ts">
  import type { PageData } from './$types'
  import { goto } from '$app/navigation'
  import StatusChip from '$lib/components/ui/StatusChip.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import { formatDate } from '$lib/utils/format'
  import { stripMarkdown } from '$lib/utils/markdown'
  import { FileText, Plus, BookOpen, NotebookPen, ScrollText } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  const ownerCount = $derived(data.recentPapers.filter(p => p.role === 'OWNER').length)
</script>

<div class="page">
  <div class="page-header">
    <h1>Dashboard</h1>
    <div class="header-actions">
      <Button variant="outlined" onclick={() => goto('/notebooks/new')}><NotebookPen size={18} /> New Notebook</Button>
      <Button onclick={() => goto('/papers/new')}><Plus size={18} /> New Paper</Button>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon"><FileText size={26} /></div>
      <div class="stat-body">
        <p class="stat-value">{data.recentPapers.length}</p>
        <p class="stat-label">Recent Papers</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon owner"><BookOpen size={26} /></div>
      <div class="stat-body">
        <p class="stat-value">{ownerCount}</p>
        <p class="stat-label">As Owner</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon notebooks"><NotebookPen size={26} /></div>
      <div class="stat-body">
        <p class="stat-value">{data.notebookCount}</p>
        <p class="stat-label">Notebooks</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon posts"><ScrollText size={26} /></div>
      <div class="stat-body">
        <p class="stat-value">{data.totalPosts}</p>
        <p class="stat-label">Total Posts</p>
      </div>
    </div>
  </div>

  <div class="sections">
    <!-- Latest notebook posts -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Latest Posts</h2>
        <a href="/notebooks" class="section-link">All notebooks →</a>
      </div>
      {#if data.latestPosts.length === 0}
        <div class="empty">
          <p>No posts yet. <a href="/notebooks/new">Create a notebook</a></p>
        </div>
      {:else}
        <div class="item-cards">
          {#each data.latestPosts as { post, notebook }}
            <a href="/notebooks/{notebook.id}/posts/{post.id}" class="item-card">
              <div class="item-card-top">
                <span class="item-title">{post.title}</span>
              </div>
              {#if post.content}
                <p class="item-preview">{stripMarkdown(post.content, 120)}</p>
              {/if}
              <div class="item-footer">
                <span class="item-sub">{notebook.title}</span>
                <span class="item-date">{formatDate(post.created_at)}</span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Recent papers -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Recent Papers</h2>
        <a href="/papers" class="section-link">All papers →</a>
      </div>
      {#if data.recentPapers.length === 0}
        <div class="empty">
          <p>No papers yet. <a href="/papers/new">Add your first paper</a></p>
        </div>
      {:else}
        <div class="item-cards">
          {#each data.recentPapers as paper}
            <a href="/papers/{paper.id}" class="item-card">
              <div class="item-card-top">
                <span class="item-title">{paper.title}</span>
                <StatusChip label={paper.role} variant={paper.role === 'OWNER' ? 'info' : 'neutral'} />
              </div>
              <div class="item-meta">
                <span>{paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}</span>
                <span class="dot">·</span>
                <span>{paper.year}</span>
                <span class="dot">·</span>
                <span class="journal">{paper.journal}</span>
              </div>
              <div class="item-footer">
                <span></span>
                <span class="item-date">{formatDate(paper.updated_at)}</span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .page { max-width: 100%; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 400; }
  .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: var(--color-surface-1); border: 1px solid var(--color-surface-3);
    border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px;
  }
  .stat-icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    background: var(--color-primary-subtle); color: var(--color-primary);
    display: flex; align-items: center; justify-content: center;
  }
  .stat-icon.owner     { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
  .stat-icon.notebooks { background: color-mix(in srgb, var(--color-warning) 20%, transparent); color: var(--color-warning); }
  .stat-icon.posts     { background: color-mix(in srgb, var(--color-info) 15%, transparent); color: var(--color-info); }
  .stat-value { font-size: 1.75rem; font-weight: 500; margin: 0; color: var(--color-text-primary); }
  .stat-label { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0; }

  .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  @media (max-width: 1019px) { .sections { grid-template-columns: 1fr; } }

  .section-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
  .section-title { font-size: 1.0625rem; font-weight: 500; margin: 0; }
  .section-link { font-size: 0.8125rem; color: var(--color-primary); text-decoration: none; }
  .section-link:hover { text-decoration: underline; }

  .item-cards { display: flex; flex-direction: column; gap: 10px; }
  .item-card {
    background: var(--color-surface-1); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 14px 16px; text-decoration: none; display: block;
    transition: box-shadow var(--transition-standard);
  }
  .item-card:hover { box-shadow: var(--shadow-1); }
  .item-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 5px; }
  .item-title { font-size: 0.9375rem; font-weight: 500; color: var(--color-text-primary); line-height: 1.4; }
  .item-preview { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 8px; line-height: 1.5; }
  .item-meta { font-size: 0.8125rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-bottom: 8px; }
  .journal { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
  .dot { color: var(--color-text-disabled); }
  .item-footer { display: flex; align-items: center; justify-content: space-between; }
  .item-sub { font-size: 0.75rem; color: var(--color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
  .item-date { font-size: 0.75rem; color: var(--color-text-disabled); white-space: nowrap; }

  .empty { padding: 24px; text-align: center; color: var(--color-text-secondary); font-size: 0.875rem; background: var(--color-surface-1); border: 1px solid var(--color-surface-3); border-radius: 10px; }
  .empty a { color: var(--color-primary); }

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    .header-actions { width: 100%; justify-content: flex-end; }
  }
</style>
