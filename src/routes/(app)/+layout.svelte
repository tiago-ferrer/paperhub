<script lang="ts">
  import { page } from '$app/stores'
  import { fly } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
  import { sidebarCollapsed } from '$lib/stores/ui'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import TopBar from '$lib/components/layout/TopBar.svelte'
  import ToastStack from '$lib/components/ui/ToastStack.svelte'
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="app-shell">
  <Sidebar />

  <div
    class="main-area"
    style:margin-left="{$sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'}"
    style:transition="margin-left var(--transition-sidebar)"
  >
    <TopBar />
    {#key $page.url.pathname}
      <main class="content" in:fly={{ y: 12, duration: 180, easing: cubicOut }}>
        {@render children()}
      </main>
    {/key}
  </div>

  <ToastStack />
</div>

<style>
  .app-shell { display: flex; min-height: 100vh; background: var(--color-surface-0); }
  .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .content { flex: 1; padding: 24px; overflow-y: auto; }
</style>
