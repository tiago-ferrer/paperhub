<script lang="ts">
  interface Props { size?: number }
  let { size = 24 }: Props = $props()
</script>

<span class="spinner" style:width="{size}px" style:height="{size}px" aria-label="Loading"></span>

<style>
  .spinner {
    display: inline-block; border-radius: 50%;
    border: 2px solid var(--color-surface-3);
    border-top-color: var(--color-primary);
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
