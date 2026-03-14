<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    goto('/mcp/usage', { replaceHistory: true })
  })
</script>
