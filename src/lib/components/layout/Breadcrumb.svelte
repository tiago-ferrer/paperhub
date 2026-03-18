<script lang="ts">
  import { page } from '$app/stores'
  import { ChevronRight } from 'lucide-svelte'
  import type { Reference } from '$lib/types/reference'
  import type { Notebook, NotebookPost } from '$lib/types/notebook'
  import type { KanbanBoard } from '$lib/types/kanban'
  import type { TranscriptionGroup, Transcription } from '$lib/types/transcription'
  import type { Project } from '$lib/types/project'
  import type { GanttChart } from '$lib/types/gantt'

  function truncate(text: string, max = 24): string {
    return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
  }

  function labelFor(part: string): string {
    const data = $page.data as { reference?: Reference; notebook?: Notebook; post?: NotebookPost; board?: KanbanBoard; group?: TranscriptionGroup; transcription?: Transcription; project?: Project; chart?: GanttChart }

    if (data.reference && part === data.reference.id) {
      const firstAuthor = data.reference.author?.[0]?.split(' ').pop() ?? ''
      const extra = (data.reference.author?.length ?? 0) > 1 ? ' et al.' : ''
      return `${firstAuthor}${extra}, ${data.reference.year}`
    }

    if (data.notebook && part === data.notebook.id) {
      return truncate(data.notebook.title)
    }

    if (data.chart && part === data.chart.id) {
      return truncate(data.chart.title)
    }

    if (data.board && part === data.board.id) {
      return truncate(data.board.title)
    }

    if (data.group && part === data.group.id) {
      return truncate(data.group.name)
    }

    if (data.transcription && part === data.transcription.id) {
      return truncate(data.transcription.name)
    }

    if (data.project && part === data.project.id) {
      return truncate(data.project.name)
    }

    if (data.post && part === data.post.id) {
      return new Date(data.post.created_at).toLocaleDateString('en-US', {
        month: 'long', day: '2-digit', year: 'numeric',
      })
    }

    return part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
  }

  const crumbs = $derived.by(() => {
    const parts = $page.url.pathname.split('/').filter(Boolean)
    return parts.map((part, i) => ({
      label: labelFor(part),
      href: '/' + parts.slice(0, i + 1).join('/'),
    }))
  })
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
  {#each crumbs as crumb, i}
    {#if i > 0}
      <ChevronRight size={18} class="sep" />
    {/if}
    {#if i === crumbs.length - 1}
      <span class="current">{crumb.label}</span>
    {:else}
      <a href={crumb.href} class="link">{crumb.label}</a>
    {/if}
  {/each}
</nav>

<style>
  .breadcrumb {
    display: flex; align-items: center; gap: 4px;
    font-size: 1.006rem; min-width: 0;
  }
  .link { color: var(--color-text-secondary); text-decoration: none; }
  .link:hover { color: var(--color-primary); }
  .current { color: var(--color-text-primary); font-weight: 500; }
  :global(.sep) { color: var(--color-text-disabled); flex-shrink: 0; }
</style>
