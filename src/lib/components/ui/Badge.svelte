<script lang="ts">
  import type { Snippet } from 'svelte'
  interface Props {
    variant?: 'primary' | 'neutral'
    children: Snippet
  }
  let { variant = 'primary', children }: Props = $props()
</script>

<span class="badge badge-{variant}">{@render children()}</span>

<style>
  .badge {
    display: inline-flex; align-items: center;
    padding: 2px 7px; border-radius: 10px;
    font-size: 11px; font-weight: 600;
  }
  .badge-primary { background: var(--color-primary); color: white; }
  .badge-neutral { background: var(--color-surface-2); color: var(--color-text-secondary); }
</style>
