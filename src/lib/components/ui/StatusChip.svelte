<script lang="ts">
  interface Props {
    label: string
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  }
  let { label, variant = 'neutral' }: Props = $props()
</script>

<span class="chip chip-{variant}">{label}</span>

<style>
  .chip {
    display: inline-flex; align-items: center;
    padding: 2px 10px; border-radius: 12px;
    font-size: 12px; font-weight: 500; white-space: nowrap;
  }
  .chip-success { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
  .chip-error   { background: color-mix(in srgb, var(--color-error)   15%, transparent); color: var(--color-error); }
  .chip-warning { background: color-mix(in srgb, var(--color-warning) 25%, transparent); color: var(--color-warning); }
  .chip-info    { background: color-mix(in srgb, var(--color-info)    15%, transparent); color: var(--color-info); }
  .chip-neutral { background: var(--color-surface-2); color: var(--color-text-secondary); }
</style>
