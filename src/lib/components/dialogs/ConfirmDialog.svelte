<script lang="ts">
  import { scale, fade } from 'svelte/transition'
  import Button from '$lib/components/ui/Button.svelte'

  interface Props {
    open?: boolean
    title?: string
    message?: string
    confirmLabel?: string
    variant?: 'danger' | 'primary'
    onconfirm?: () => void
    oncancel?: () => void
  }
  let {
    open = false,
    title = 'Confirm action',
    message = '',
    confirmLabel = 'Confirm',
    variant = 'primary',
    onconfirm,
    oncancel,
  }: Props = $props()
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div class="dialog-card" transition:scale={{ start: 0.95, duration: 150 }}>
      <h3 class="dialog-title">{title}</h3>
      {#if message}<p class="dialog-message">{message}</p>{/if}
      <div class="dialog-actions">
        <Button variant="text" onclick={oncancel}>Cancel</Button>
        <Button
          variant="filled"
          onclick={onconfirm}
        >{confirmLabel}</Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .dialog-card {
    background: var(--color-surface-0); border-radius: 12px;
    padding: 24px; max-width: 400px; width: 100%;
    box-shadow: var(--shadow-3);
  }
  .dialog-title { margin: 0 0 8px; font-size: 18px; font-weight: 500; }
  .dialog-message { margin: 0 0 20px; font-size: 14px; color: var(--color-text-secondary); }
  .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
