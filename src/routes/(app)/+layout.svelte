<script lang="ts">
  import { page } from '$app/stores'
  import { fly } from 'svelte/transition'
  import { cubicOut } from 'svelte/easing'
  import { sidebarCollapsed, sidebarMobileOpen, closeMobileSidebar } from '$lib/stores/ui'
  import Sidebar from '$lib/components/layout/Sidebar.svelte'
  import TopBar from '$lib/components/layout/TopBar.svelte'
  import ToastStack from '$lib/components/ui/ToastStack.svelte'
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="app-shell">
  <Sidebar />

  {#if $sidebarMobileOpen}
    <div class="mobile-backdrop" onclick={closeMobileSidebar} aria-hidden="true"></div>
  {/if}

  <div
    class="main-area"
    class:collapsed={$sidebarCollapsed}
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

  .main-area {
    flex: 1; display: flex; flex-direction: column; min-width: 0;
    margin-left: var(--sidebar-width);
    transition: margin-left var(--transition-sidebar);
  }
  .main-area.collapsed { margin-left: var(--sidebar-collapsed-width); }

  /* Below 1020px: sidebar is overlay, no offset */
  @media (max-width: 1019px) {
    .main-area, .main-area.collapsed { margin-left: 0; }
  }

  .mobile-backdrop {
    position: fixed; inset: 0; z-index: 39;
    background: rgba(0,0,0,0.4);
  }

  .content { flex: 1; padding: 24px; overflow-y: auto; overflow-x: hidden; }

  @media (max-width: 1019px) {
    .content { padding: 16px 12px; }
  }
</style>
