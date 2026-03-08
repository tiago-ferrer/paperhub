<script lang="ts">
  import { page } from '$app/stores'
  import { ChevronRight } from 'lucide-svelte'

  const crumbs = $derived.by(() => {
    const parts = $page.url.pathname.split('/').filter(Boolean)
    return parts.map((part, i) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      href: '/' + parts.slice(0, i + 1).join('/'),
    }))
  })
</script>

<nav class="breadcrumb" aria-label="Breadcrumb">
  {#each crumbs as crumb, i}
    {#if i > 0}
      <ChevronRight size={14} class="sep" />
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
    font-size: 14px; min-width: 0;
  }
  .link { color: var(--color-text-secondary); text-decoration: none; }
  .link:hover { color: var(--color-primary); }
  .current { color: var(--color-text-primary); font-weight: 500; }
  :global(.sep) { color: var(--color-text-disabled); flex-shrink: 0; }
</style>
