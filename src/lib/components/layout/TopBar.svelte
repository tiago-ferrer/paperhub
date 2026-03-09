<script lang="ts">
  import { goto } from '$app/navigation'
  import { authStore } from '$lib/stores/auth'
  import { toggleTheme, theme, toggleMobileSidebar } from '$lib/stores/ui'
  import { Sun, Moon, LogOut, Menu } from 'lucide-svelte'
  import Breadcrumb from './Breadcrumb.svelte'
  import SearchBox from '$lib/components/forms/SearchBox.svelte'

  function logout() { authStore.clear(); goto('/login') }
</script>

<header class="topbar">
  <div class="topbar-left">
    <button class="icon-btn mobile-menu" onclick={toggleMobileSidebar} aria-label="Open menu">
      <Menu size={25} />
    </button>
    <Breadcrumb />
  </div>
  <div class="topbar-actions">
    <SearchBox placeholder="Search papers…" />
    <button class="icon-btn" onclick={toggleTheme} aria-label="Toggle theme">
      {#if $theme === 'dark'}
        <Sun size={25} />
      {:else}
        <Moon size={25} />
      {/if}
    </button>
    <button class="icon-btn" onclick={logout} aria-label="Log out">
      <LogOut size={25} />
    </button>
  </div>
</header>

<style>
  .topbar {
    height: var(--topbar-height); position: sticky; top: 0; z-index: 30;
    background: var(--color-surface-0); border-bottom: 1px solid var(--color-surface-3);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; gap: 16px; flex-shrink: 0;
    box-shadow: var(--shadow-1);
  }
  .topbar-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .topbar-actions { display: flex; align-items: center; gap: 8px; }
  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
    flex-shrink: 0;
  }
  .icon-btn:hover { background: var(--color-surface-2); }

  /* Hide hamburger on desktop */
  .mobile-menu { display: none; }
  @media (max-width: 1019px) {
    .mobile-menu { display: flex; }
    .topbar { padding: 0 12px; }
  }
</style>
