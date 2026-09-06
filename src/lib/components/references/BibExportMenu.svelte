<script lang="ts">
  import type { Reference } from '$lib/types/reference'
  import { referencesToBibTeX, bibFilename } from '$lib/utils/bibtex-export'
  import { toast } from '$lib/stores/toast'
  import Button from '$lib/components/ui/Button.svelte'
  import { Quote, Copy, Download, Check } from 'lucide-svelte'

  interface Props {
    references: Reference[]
    filenameBase: string
    /** Icon-only trigger (row actions) vs a labeled outlined button (page/detail header). */
    variant?: 'icon' | 'button'
  }
  let { references, filenameBase, variant = 'icon' }: Props = $props()

  let open   = $state(false)
  let copied = $state(false)
  let copyTimer: ReturnType<typeof setTimeout>

  function toggle(e: MouseEvent) {
    e.stopPropagation()
    open = !open
  }

  async function copyBib() {
    open = false
    try {
      await navigator.clipboard.writeText(referencesToBibTeX(references))
      clearTimeout(copyTimer)
      copied = true
      copyTimer = setTimeout(() => (copied = false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  function downloadBib() {
    open = false
    const blob = new Blob([referencesToBibTeX(references)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = bibFilename(filenameBase)
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function onWindowClick(e: MouseEvent) {
    if (open && !(e.target as HTMLElement).closest('.bib-export-wrap')) open = false
  }
</script>

<svelte:window onclick={onWindowClick} />

<div class="bib-export-wrap">
  {#if variant === 'button'}
    <Button variant="outlined" size="sm" onclick={toggle}>
      {#if copied}<Check size={18} /><span class="btn-label"> Copied!</span>{:else}<Quote size={18} /><span class="btn-label"> Export .bib</span>{/if}
    </Button>
  {:else}
    <button class="icon-btn" class:done={copied} title="Export .bib" onclick={toggle}>
      {#if copied}<Check size={20} />{:else}<Quote size={20} />{/if}
    </button>
  {/if}

  {#if open}
    <div class="menu">
      <button class="menu-item" onclick={copyBib}><Copy size={15} /> Copy to clipboard</button>
      <button class="menu-item" onclick={downloadBib}><Download size={15} /> Download .bib</button>
    </div>
  {/if}
</div>

<style>
  .bib-export-wrap { position: relative; display: inline-flex; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn.done { color: var(--color-success); }

  .menu {
    position: absolute; right: 0; top: calc(100% + 4px); z-index: 40;
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 8px; box-shadow: var(--shadow-2);
    min-width: 190px; display: flex; flex-direction: column; padding: 4px;
  }
  .menu-item {
    display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 5px;
    border: none; background: transparent; cursor: pointer; text-align: left;
    font-size: 0.8125rem; color: var(--color-text-primary); white-space: nowrap;
    transition: background var(--transition-standard);
  }
  .menu-item:hover { background: var(--color-surface-2); }

  @media (max-width: 1019px) {
    .btn-label { display: none; }
  }
</style>
