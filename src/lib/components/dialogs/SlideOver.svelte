<script lang="ts">
  import { fly, fade } from 'svelte/transition'
  import { X } from 'lucide-svelte'
  import type { Snippet } from 'svelte'

  interface Props {
    open?: boolean
    title?: string
    width?: string
    onclose?: () => void
    headerActions?: Snippet
    children?: Snippet
  }
  let { open = false, title = '', width = '480px', onclose, headerActions, children }: Props = $props()
</script>

{#if open}
  <div
    class="backdrop"
    transition:fade={{ duration: 200 }}
    onclick={onclose}
    role="presentation"
  ></div>
  <div
    class="slide-over"
    style:width
    transition:fly={{ x: 480, duration: 300 }}
    aria-modal="true"
    role="dialog"
    aria-label={title}
  >
    <div class="slide-over-header">
      <h2>{title}</h2>
      <div class="header-actions">
        {#if headerActions}{@render headerActions()}{/if}
        <button class="close-btn" onclick={onclose} aria-label="Close">
          <X size={20} />
        </button>
      </div>
    </div>
    <div class="slide-over-body">
      {#if children}{@render children()}{/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,.3); z-index: 50;
  }
  .slide-over {
    position: fixed; top: 0; right: 0; height: 100vh; z-index: 51;
    background: var(--color-surface-0); box-shadow: var(--shadow-3);
    display: flex; flex-direction: column; max-width: 100vw;
  }
  .slide-over-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px; border-bottom: 1px solid var(--color-surface-3);
    flex-shrink: 0;
  }
  .slide-over-header h2 { margin: 0; font-size: 18px; font-weight: 500; }
  .header-actions { display: flex; align-items: center; gap: 8px; }
  .close-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .close-btn:hover { background: var(--color-surface-2); }
  .slide-over-body { flex: 1; overflow-y: auto; padding: 24px; }
</style>
