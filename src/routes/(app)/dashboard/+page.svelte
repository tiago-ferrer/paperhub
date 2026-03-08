<script lang="ts">
  import type { PageData } from './$types'
  import { goto } from '$app/navigation'
  import StatusChip from '$lib/components/ui/StatusChip.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import { formatDate } from '$lib/utils/format'
  import { FileText, Key, Plus, BookOpen, Users } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  const ownerCount  = $derived(data.recentPapers.filter(p => p.role === 'OWNER').length)
  const viewerCount = $derived(data.recentPapers.filter(p => p.role === 'VIEWER').length)
</script>

<div class="page">
  <div class="page-header">
    <h1>Dashboard</h1>
    <Button onclick={() => goto('/papers/new')}><Plus size={16} /> New Paper</Button>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon"><FileText size={24} /></div>
      <div class="stat-body">
        <p class="stat-value">{data.recentPapers.length}</p>
        <p class="stat-label">Recent Papers</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon owner"><BookOpen size={24} /></div>
      <div class="stat-body">
        <p class="stat-value">{ownerCount}</p>
        <p class="stat-label">As Owner</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon viewer"><Users size={24} /></div>
      <div class="stat-body">
        <p class="stat-value">{viewerCount}</p>
        <p class="stat-label">Shared with me</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon keys"><Key size={24} /></div>
      <div class="stat-body">
        <p class="stat-value">{data.apiKeyCount}</p>
        <p class="stat-label">API Keys</p>
      </div>
    </div>
  </div>

  <h2 class="section-title">Recent Papers</h2>
  {#if data.recentPapers.length === 0}
    <div class="empty">
      <p>No papers yet. <a href="/papers/new">Add your first paper</a></p>
    </div>
  {:else}
    <div class="paper-cards">
      {#each data.recentPapers as paper}
        <a href="/papers/{paper.id}" class="paper-card">
          <div class="paper-card-top">
            <span class="paper-title">{paper.title}</span>
            <StatusChip label={paper.role} variant={paper.role === 'OWNER' ? 'info' : 'neutral'} />
          </div>
          <div class="paper-meta">
            <span>{paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}</span>
            <span class="dot">·</span>
            <span>{paper.year}</span>
            <span class="dot">·</span>
            <span>{paper.journal}</span>
          </div>
          <p class="paper-updated">Updated {formatDate(paper.updated_at)}</p>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page { max-width: 1100px; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .page-header h1 { margin: 0; font-size: 28px; font-weight: 400; }

  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: var(--color-surface-1); border: 1px solid var(--color-surface-3);
    border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px;
  }
  .stat-icon {
    width: 48px; height: 48px; border-radius: 12px;
    background: var(--color-primary-subtle); color: var(--color-primary);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .stat-icon.owner { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
  .stat-icon.viewer { background: color-mix(in srgb, var(--color-warning) 20%, transparent); color: var(--color-warning); }
  .stat-icon.keys { background: color-mix(in srgb, var(--color-info) 15%, transparent); color: var(--color-info); }
  .stat-value { font-size: 28px; font-weight: 500; margin: 0; color: var(--color-text-primary); }
  .stat-label { font-size: 13px; color: var(--color-text-secondary); margin: 0; }

  .section-title { font-size: 18px; font-weight: 500; margin: 0 0 16px; }

  .paper-cards { display: flex; flex-direction: column; gap: 12px; }
  .paper-card {
    background: var(--color-surface-1); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 16px 20px; text-decoration: none; display: block;
    transition: box-shadow var(--transition-standard);
  }
  .paper-card:hover { box-shadow: var(--shadow-1); }
  .paper-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
  .paper-title { font-size: 15px; font-weight: 500; color: var(--color-text-primary); line-height: 1.4; }
  .paper-meta { font-size: 13px; color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .dot { color: var(--color-text-disabled); }
  .paper-updated { font-size: 12px; color: var(--color-text-disabled); margin: 6px 0 0; }
  .empty { padding: 32px; text-align: center; color: var(--color-text-secondary); font-size: 14px; }
  .empty a { color: var(--color-primary); }
</style>
