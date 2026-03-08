<script lang="ts">
  import { scale, fade } from 'svelte/transition'
  import { X } from 'lucide-svelte'
  import type { Snippet } from 'svelte'

  interface Props {
    open?: boolean
    title?: string
    onclose?: () => void
    children?: Snippet
  }
  let { open = false, title = '', onclose, children }: Props = $props()
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div
      class="modal-card"
      transition:scale={{ start: 0.95, duration: 150 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div class="modal-header">
        <h3>{title}</h3>
        <button class="close-btn" onclick={onclose} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div class="modal-body">
        {#if children}{@render children()}{/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .modal-card {
    background: var(--color-surface-0); border-radius: 12px;
    max-width: 520px; width: 100%; box-shadow: var(--shadow-3);
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px; border-bottom: 1px solid var(--color-surface-3);
  }
  .modal-header h3 { margin: 0; font-size: 18px; font-weight: 500; }
  .close-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .close-btn:hover { background: var(--color-surface-2); }
  .modal-body { padding: 24px; }
</style>
