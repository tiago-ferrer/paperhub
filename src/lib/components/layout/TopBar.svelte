<script lang="ts">
  import { goto } from '$app/navigation'
  import { authStore } from '$lib/stores/auth'
  import { toggleTheme, theme } from '$lib/stores/ui'
  import { Sun, Moon, LogOut } from 'lucide-svelte'
  import Breadcrumb from './Breadcrumb.svelte'
  import SearchBox from '$lib/components/forms/SearchBox.svelte'

  function logout() { authStore.clear(); goto('/login') }
</script>

<header class="topbar">
  <Breadcrumb />
  <div class="topbar-actions">
    <SearchBox placeholder="Search papers…" />
    <button class="icon-btn" onclick={toggleTheme} aria-label="Toggle theme">
      {#if $theme === 'dark'}
        <Sun size={20} />
      {:else}
        <Moon size={20} />
      {/if}
    </button>
    <button class="icon-btn" onclick={logout} aria-label="Log out">
      <LogOut size={20} />
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
  .topbar-actions { display: flex; align-items: center; gap: 8px; }
  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); }
</style>
