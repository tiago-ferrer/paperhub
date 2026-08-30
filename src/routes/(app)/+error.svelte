<script lang="ts">
  import { page } from '$app/stores'
  import { invalidateAll } from '$app/navigation'
  import { AlertCircle } from 'lucide-svelte'
  import Button from '$lib/components/ui/Button.svelte'
</script>

<!--
  Error boundary for everything under (app)/. Without this file, any unhandled
  load failure in this group (a critical fetch throwing, error(404, ...), etc.)
  bubbles all the way up to the root src/routes/+error.svelte — which renders
  OUTSIDE (app)/+layout.svelte, so Sidebar/TopBar/ToastStack disappear entirely
  and the user is left on a bare status+message screen with no way to navigate.

  Having a +error.svelte here means SvelteKit renders it in place of the page,
  INSIDE (app)/+layout.svelte instead — the app shell stays up and usable.
-->
<div class="error-page">
  <AlertCircle size={40} class="icon" />
  <h1>{$page.status}</h1>
  <p>{$page.error?.message}</p>
  <Button variant="outlined" onclick={() => invalidateAll()}>Tentar novamente</Button>
</div>

<style>
  .error-page {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 14px; padding: 64px 24px; text-align: center; min-height: 320px;
  }
  .error-page :global(.icon) { color: var(--color-error); }
  h1 { font-size: 2.5rem; margin: 0; color: var(--color-text-secondary); font-weight: 500; }
  p { font-size: 0.9375rem; color: var(--color-text-secondary); margin: 0; max-width: 480px; }
</style>
