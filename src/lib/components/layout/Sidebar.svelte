<script lang="ts">
  import { page } from '$app/stores'
  import { sidebarCollapsed, toggleSidebar } from '$lib/stores/ui'
  import { currentUser } from '$lib/stores/auth'
  import { NAV_SECTIONS } from '$lib/config/navigation'
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'
  import Avatar from '$lib/components/ui/Avatar.svelte'

  const activeHref = $derived($page.url.pathname)
</script>

<aside
  class="sidebar"
  class:collapsed={$sidebarCollapsed}
  aria-label="Main navigation"
>
  <div class="sidebar-header">
    {#if !$sidebarCollapsed}
      <span class="product-name">PaperHub</span>
    {/if}
    <button class="collapse-btn" onclick={toggleSidebar} aria-label="Toggle sidebar">
      {#if $sidebarCollapsed}
        <ChevronRight size={18} />
      {:else}
        <ChevronLeft size={18} />
      {/if}
    </button>
  </div>

  <nav class="sidebar-nav">
    {#each NAV_SECTIONS as section}
      {#if section.title && !$sidebarCollapsed}
        <p class="section-label">{section.title}</p>
      {/if}
      {#each section.items as item}
        {@const active = activeHref.startsWith(item.href)}
        <a
          href={item.href}
          class="nav-item"
          class:active
          title={$sidebarCollapsed ? item.label : undefined}
          aria-current={active ? 'page' : undefined}
        >
          <item.icon size={20} />
          {#if !$sidebarCollapsed}
            <span>{item.label}</span>
          {/if}
          {#if item.badge && !$sidebarCollapsed}
            <span class="badge">{item.badge}</span>
          {/if}
        </a>
      {/each}
    {/each}
  </nav>

  {#if !$sidebarCollapsed}
    <div class="sidebar-footer">
      <div class="user-chip">
        <Avatar name={$currentUser ?? 'U'} size={32} />
        <span class="username">{$currentUser}</span>
      </div>
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    position: fixed; top: 0; left: 0; height: 100vh; z-index: 40;
    width: var(--sidebar-width);
    background: var(--color-sidebar-bg);
    border-right: 1px solid var(--color-surface-3);
    display: flex; flex-direction: column;
    transition: width var(--transition-sidebar);
    overflow: hidden;
  }
  .sidebar.collapsed { width: var(--sidebar-collapsed-width); }

  .sidebar-header {
    height: var(--topbar-height);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px; gap: 8px; flex-shrink: 0;
    border-bottom: 1px solid var(--color-surface-3);
  }
  .product-name { font-size: 16px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; }
  .collapse-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
    flex-shrink: 0;
  }
  .collapse-btn:hover { background: var(--color-surface-2); }

  .sidebar-nav { flex: 1; overflow-y: auto; padding: 8px 0; }
  .section-label {
    font-size: 11px; font-weight: 500; letter-spacing: .8px; text-transform: uppercase;
    color: var(--color-text-secondary); padding: 16px 16px 4px; white-space: nowrap; margin: 0;
  }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; margin: 2px 8px; border-radius: 24px;
    color: var(--color-sidebar-text); text-decoration: none; white-space: nowrap;
    font-size: 14px; font-weight: 500;
    transition: background var(--transition-standard), color var(--transition-standard);
  }
  .nav-item:hover { background: var(--color-surface-2); }
  .nav-item.active {
    background: var(--color-sidebar-active);
    color: var(--color-sidebar-active-text);
  }
  .badge {
    margin-left: auto; background: var(--color-primary); color: white;
    font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 10px;
  }
  .sidebar-footer {
    padding: 12px 16px; border-top: 1px solid var(--color-surface-3); flex-shrink: 0;
  }
  .user-chip { display: flex; align-items: center; gap: 10px; }
  .username { font-size: 13px; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
