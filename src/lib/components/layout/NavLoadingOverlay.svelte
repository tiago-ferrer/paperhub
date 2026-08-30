<script lang="ts">
  import { fade } from 'svelte/transition'
  import Spinner from '$lib/components/ui/Spinner.svelte'
</script>

<div
  class="nav-overlay"
  role="status"
  aria-live="polite"
  aria-label="Loading page"
  transition:fade={{ duration: 120 }}
>
  <Spinner size={32} />
</div>

<style>
  .nav-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-surface-0) 65%, transparent);
    backdrop-filter: blur(1px);
    cursor: wait;
  }
</style>
