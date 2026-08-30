<script lang="ts">
  interface Props {
    value: number
    max: number
    label?: string
  }
  let { value, max, label }: Props = $props()

  const percent = $derived(max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0)
</script>

<div class="progress-wrap">
  {#if label}<p class="progress-label">{label}</p>{/if}
  <div
    class="progress-track"
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-label={label ?? 'Progress'}
  >
    <div class="progress-fill" style:width="{percent}%"></div>
  </div>
</div>

<style>
  .progress-wrap { display: flex; flex-direction: column; gap: 6px; }
  .progress-label { margin: 0; font-size: 0.8125rem; color: var(--color-text-secondary); text-align: center; }
  .progress-track {
    width: 100%; height: 8px; border-radius: 999px;
    background: var(--color-surface-2); overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: 999px; background: var(--color-primary);
    transition: width var(--transition-standard);
  }
</style>
