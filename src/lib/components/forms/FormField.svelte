<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    label: string
    error?: string | null
    hint?: string
    required?: boolean
    children: Snippet
  }
  let { label, error, hint, required = false, children }: Props = $props()
</script>

<div class="field" class:has-error={!!error}>
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="label">{label}{#if required}<span class="req">*</span>{/if}</label>
  <div class="control">{@render children()}</div>
  {#if error}
    <p class="error">{error}</p>
  {:else if hint}
    <p class="hint">{hint}</p>
  {/if}
</div>

<style>
  .field { display: flex; flex-direction: column; gap: 4px; }
  .label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
  .req { color: var(--color-error); margin-left: 2px; }
  .error { font-size: 12px; color: var(--color-error); margin: 0; }
  .hint  { font-size: 12px; color: var(--color-text-secondary); margin: 0; }
  .control :global(input),
  .control :global(textarea),
  .control :global(select) {
    width: 100%; padding: 8px 12px; border-radius: 6px;
    border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 14px; font-family: inherit; outline: none;
    transition: border-color var(--transition-standard);
  }
  .control :global(input:focus),
  .control :global(textarea:focus),
  .control :global(select:focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-subtle);
  }
  .has-error .control :global(input),
  .has-error .control :global(textarea),
  .has-error .control :global(select) {
    border-color: var(--color-error);
  }
</style>
