<script lang="ts">
  import mermaid from 'mermaid'
  import { theme } from '$lib/stores/ui'

  let { html, class: cls = '' }: { html: string; class?: string } = $props()

  let container = $state<HTMLElement | null>(null)
  let mermaidReady = false

  function ensureInit() {
    if (mermaidReady) return
    mermaid.initialize({ startOnLoad: false, theme: $theme === 'dark' ? 'dark' : 'neutral' })
    mermaidReady = true
  }

  $effect(() => {
    void html // re-run when html changes
    if (!container) return
    ensureInit()
    const nodes = Array.from(container.querySelectorAll<HTMLElement>('pre.mermaid'))
    if (nodes.length) {
      mermaid.run({ nodes }).catch(() => {})
    }
  })
</script>

<div bind:this={container} class="md-content {cls}">
  {@html html}
</div>

<style>
  .md-content { font-size: 0.9375rem; line-height: 1.75; width: 100%; }

  .md-content :global(h1),
  .md-content :global(h2),
  .md-content :global(h3),
  .md-content :global(h4) {
    font-weight: 600; line-height: 1.3; margin: 1.25em 0 0.5em; color: var(--color-text-primary);
  }
  .md-content :global(h1) { font-size: 1.5rem; }
  .md-content :global(h2) { font-size: 1.25rem; border-bottom: 1px solid var(--color-surface-3); padding-bottom: 4px; }
  .md-content :global(h3) { font-size: 1.1rem; }
  .md-content :global(p) { margin: 0.75em 0; color: var(--color-text-primary); }
  .md-content :global(a) { color: var(--color-primary); }
  .md-content :global(strong) { font-weight: 600; }
  .md-content :global(em) { font-style: italic; }
  .md-content :global(code) {
    background: var(--color-surface-2); padding: 1px 5px; border-radius: 4px;
    font-size: 0.85em; font-family: 'Menlo', 'Monaco', monospace;
  }
  .md-content :global(pre) {
    background: var(--color-surface-2); padding: 12px 16px; border-radius: 8px;
    overflow-x: auto; margin: 1em 0;
  }
  .md-content :global(pre) :global(code) { background: none; padding: 0; font-size: 0.875em; }
  .md-content :global(blockquote) {
    border-left: 3px solid var(--color-primary-subtle); padding-left: 12px;
    margin: 1em 0; color: var(--color-text-secondary); font-style: italic;
  }
  .md-content :global(ul),
  .md-content :global(ol) { padding-left: 1.5em; margin: 0.75em 0; }
  .md-content :global(li) { margin: 0.3em 0; }
  .md-content :global(table) { border-collapse: collapse; width: 100%; margin: 1em 0; }
  .md-content :global(th),
  .md-content :global(td) { border: 1px solid var(--color-surface-3); padding: 8px 12px; text-align: left; }
  .md-content :global(th) { background: var(--color-surface-1); font-weight: 500; }
  .md-content :global(hr) { border: none; border-top: 1px solid var(--color-surface-3); margin: 1.5em 0; }
  .md-content :global(.katex-display) { overflow-x: auto; padding: 8px 0; }

  /* Mermaid diagrams */
  .md-content :global(pre.mermaid) {
    background: var(--color-surface-1); display: flex; justify-content: center;
    padding: 20px; border-radius: 8px; border: 1px solid var(--color-surface-3);
  }
  .md-content :global(pre.mermaid svg) { max-width: 100%; height: auto; }
</style>
