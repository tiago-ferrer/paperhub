<script lang="ts">
  import type { Reference } from '$lib/types/reference'
  import { formatCitation, type CitationStyle } from '$lib/utils/citation'
  import { Copy, Check } from 'lucide-svelte'

  interface Props {
    reference: Reference
  }
  let { reference }: Props = $props()

  const STYLES: CitationStyle[] = ['APA', 'MLA', 'Chicago', 'ABNT']
  let active  = $state<CitationStyle>('APA')
  let copied  = $state(false)
  let copyTimer: ReturnType<typeof setTimeout>

  const citation = $derived(formatCitation(reference, active))

  async function copy() {
    await navigator.clipboard.writeText(citation)
    clearTimeout(copyTimer)
    copied = true
    copyTimer = setTimeout(() => (copied = false), 2000)
  }
</script>

<div class="card">
  <div class="cite-header">
    <h2 class="card-title">Cite</h2>
    <div class="style-tabs">
      {#each STYLES as style}
        <button
          class="tab"
          class:active={active === style}
          onclick={() => active = style}
        >{style}</button>
      {/each}
    </div>
  </div>

  <div class="citation-box">
    <p class="citation-text">{citation}</p>
    <button class="copy-btn" class:done={copied} onclick={copy} title="Copy to clipboard">
      {#if copied}
        <Check size={16} />
        Copied!
      {:else}
        <Copy size={16} />
        Copy
      {/if}
    </button>
  </div>
</div>

<style>
  .card {
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 10px; padding: 20px; margin-bottom: 16px;
  }

  .cite-header {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 10px; margin-bottom: 14px;
  }
  .card-title { margin: 0; font-size: 0.9375rem; font-weight: 500; }

  .style-tabs { display: flex; gap: 4px; }
  .tab {
    padding: 4px 12px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer;
    color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .tab:hover { background: var(--color-surface-2); }
  .tab.active {
    background: var(--color-primary-subtle);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .citation-box {
    background: var(--color-surface-1); border-radius: 8px;
    padding: 14px 14px 10px; display: flex; flex-direction: column; gap: 10px;
  }
  .citation-text {
    margin: 0; font-size: 0.875rem; line-height: 1.7;
    color: var(--color-text-primary); word-break: break-word;
  }

  .copy-btn {
    align-self: flex-end; display: flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-secondary);
    font-size: 0.8125rem; cursor: pointer;
    transition: all var(--transition-standard);
  }
  .copy-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .copy-btn.done {
    border-color: var(--color-success);
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 8%, transparent);
  }
</style>
