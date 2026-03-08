<script lang="ts">
  interface Props { name: string; size?: number }
  let { name, size = 32 }: Props = $props()
  const initial = $derived(name ? name[0].toUpperCase() : 'U')
</script>

<div class="avatar" style:width="{size}px" style:height="{size}px" style:font-size="{Math.round(size * 0.4)}px">
  {initial}
</div>

<style>
  .avatar {
    border-radius: 50%; background: var(--color-primary); color: white;
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; flex-shrink: 0;
  }
</style>
