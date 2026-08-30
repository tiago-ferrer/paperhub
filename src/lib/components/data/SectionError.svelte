<script lang="ts">
  import { AlertCircle, RefreshCw } from 'lucide-svelte'

  interface Props {
    /** Name of the section that failed, e.g. "Gantt charts" — used in the default message. */
    label: string
    /** Override the default "Could not load X" message entirely. */
    message?: string
    /** Shown as a "Try again" action when provided; re-runs just this section's fetch. */
    onretry?: () => void
  }
  let { label, message, onretry }: Props = $props()
</script>

<!--
  Inline error for one section/widget of a page whose data failed independently
  of the rest (paired with `settle()` in the loader — see settle.ts). Use this
  instead of letting the fetch throw into the page-wide +error.svelte, so the
  rest of the screen stays usable.
-->
<div class="section-error" role="alert">
  <AlertCircle size={18} class="icon" />
  <span class="text">{message ?? `Não foi possível carregar "${label}" agora.`}</span>
  {#if onretry}
    <button class="retry" onclick={onretry}>
      <RefreshCw size={14} /> Tentar novamente
    </button>
  {/if}
</div>

<style>
  .section-error {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 14px 16px; border-radius: 8px;
    background: color-mix(in srgb, var(--color-error) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-error) 25%, transparent);
    font-size: 0.875rem;
  }
  .section-error :global(.icon) { flex-shrink: 0; color: var(--color-error); }
  .text { flex: 1; min-width: 160px; color: var(--color-text-primary); }
  .retry {
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    padding: 5px 10px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); cursor: pointer; font-size: 0.8125rem;
    color: var(--color-text-primary); transition: background var(--transition-standard);
  }
  .retry:hover { background: var(--color-surface-2); }
</style>
