<script lang="ts">
  import { scale, fade } from 'svelte/transition'
  import { AlertTriangle } from 'lucide-svelte'
  import Button from '$lib/components/ui/Button.svelte'

  interface Props {
    open?: boolean
    title?: string
    message?: string
    confirmPhrase: string
    confirmLabel?: string
    onconfirm?: () => void
    oncancel?: () => void
  }

  let {
    open = false,
    title = 'Confirm deletion',
    message = 'This item will be permanently deleted in 7 days. You can restore it from Recently Deleted.',
    confirmPhrase,
    confirmLabel = 'Delete',
    onconfirm,
    oncancel,
  }: Props = $props()

  let inputValue = $state('')

  $effect(() => { if (open) inputValue = '' })

  const canConfirm = $derived(inputValue === confirmPhrase)
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div
      class="dialog-card"
      transition:scale={{ start: 0.95, duration: 150 }}
      role="dialog"
      aria-modal="true"
    >
      <div class="danger-header">
        <AlertTriangle size={20} />
        <span>{title}</span>
      </div>

      {#if message}
        <p class="dialog-message">{message}</p>
      {/if}

      <p class="phrase-instruction">
        Type <code>{confirmPhrase}</code> to confirm:
      </p>
      <input
        class="phrase-input"
        bind:value={inputValue}
        placeholder={confirmPhrase}
        aria-label="Type the confirmation phrase"
        autocomplete="off"
        spellcheck="false"
      />

      <div class="dialog-actions">
        <Button variant="text" onclick={oncancel}>Cancel</Button>
        <Button variant="filled" disabled={!canConfirm} onclick={onconfirm}>{confirmLabel}</Button>
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
    background: var(--color-surface-0);
    border-radius: 12px;
    border-top: 3px solid var(--color-error);
    padding: 24px;
    max-width: 440px;
    width: 100%;
    box-shadow: var(--shadow-3);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .danger-header {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--color-error);
    font-size: 1.0625rem;
    font-weight: 500;
  }

  .dialog-message {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .phrase-instruction {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .phrase-instruction code {
    font-family: monospace;
    font-size: 0.8125rem;
    background: var(--color-surface-2);
    padding: 1px 5px;
    border-radius: 4px;
    color: var(--color-text-primary);
    word-break: break-all;
  }

  .phrase-input {
    padding: 8px 12px;
    border: 1px solid var(--color-surface-3);
    border-radius: 6px;
    font-size: 0.875rem;
    background: var(--color-surface-0);
    color: var(--color-text-primary);
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color var(--transition-standard);
  }
  .phrase-input:focus { border-color: var(--color-primary); }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }
</style>
