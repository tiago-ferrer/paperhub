<script lang="ts">
  import { page } from '$app/stores'
  import { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, closeMobileSidebar } from '$lib/stores/ui'
  import { currentUser } from '$lib/stores/auth'
  import { NAV_SECTIONS } from '$lib/config/navigation'
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'
  import Avatar from '$lib/components/ui/Avatar.svelte'

  const activeHref = $derived($page.url.pathname)

  // Close mobile sidebar on navigation
  $effect(() => { $page.url.pathname; closeMobileSidebar() })
</script>

<aside
  class="sidebar"
  class:collapsed={$sidebarCollapsed}
  class:mobile-open={$sidebarMobileOpen}
  aria-label="Main navigation"
>
  <div class="sidebar-header" class:collapsed={$sidebarCollapsed}>
    {#if !$sidebarCollapsed}
      <div class="product-brand">
        <span class="product-name"><span class="logo-paper">paper</span><span class="logo-hub">hub</span></span>
        <span class="product-tagline">Research | Share | Connect</span>
      </div>
    {/if}
    <button class="collapse-btn" onclick={toggleSidebar} aria-label="Toggle sidebar">
      {#if $sidebarCollapsed}
        <ChevronRight size={29} />
      {:else}
        <ChevronLeft size={29} />
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
          <item.icon size={$sidebarCollapsed ? 20 : 31} />
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
        <Avatar name={$currentUser ?? 'U'} size={40} />
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
    transition: width var(--transition-sidebar), transform var(--transition-sidebar);
    overflow: hidden;
  }
  .sidebar.collapsed { width: var(--sidebar-collapsed-width); }

  /* Below 1020px: sidebar hidden off-screen, slides in as overlay */
  @media (max-width: 1019px) {
    .sidebar { width: var(--sidebar-width); transform: translateX(-100%); }
    .sidebar.mobile-open { transform: translateX(0); }
  }

  .sidebar-header {
    height: var(--topbar-height);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px; gap: 8px; flex-shrink: 0;
    border-bottom: 1px solid var(--color-surface-3);
  }
  .sidebar-header.collapsed {
    justify-content: center;
    padding: 0;
  }

  /* On mobile the sidebar is always expanded, so show header normally */
  @media (max-width: 1019px) {
    .sidebar-header.collapsed { justify-content: space-between; padding: 0 16px; }
  }

  .product-brand { display: flex; flex-direction: column; gap: 1px; }
  .product-name { font-size: 20px; font-weight: 600; white-space: nowrap; }
  .product-tagline { font-size: 0.6rem; color: #545A62; letter-spacing: 0.05em; white-space: nowrap; }
  .logo-paper { color: #447EE2; }
  .logo-hub   { color: #596772; }
  :global([data-theme="dark"]) .logo-hub { color: #ffffff; }

  .collapse-btn {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
    flex-shrink: 0;
  }
  .collapse-btn:hover { background: var(--color-surface-2); }

  /* Hide collapse button on mobile */
  @media (max-width: 1019px) {
    .collapse-btn { display: none; }
  }

  .sidebar-nav { flex: 1; overflow-y: auto; padding: 8px 0; }
  .section-label {
    font-size: 0.6875rem; font-weight: 500; letter-spacing: .8px; text-transform: uppercase;
    color: var(--color-text-secondary); padding: 16px 16px 4px; white-space: nowrap; margin: 0;
  }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; margin: 2px 8px; border-radius: 24px;
    color: var(--color-sidebar-text); text-decoration: none; white-space: nowrap;
    font-size: 0.875rem; font-weight: 500;
    transition: background var(--transition-standard), color var(--transition-standard);
  }
  .nav-item:hover { background: var(--color-surface-2); }
  .nav-item.active {
    background: var(--color-sidebar-active);
    color: var(--color-sidebar-active-text);
  }
  .badge {
    margin-left: auto; background: var(--color-primary); color: white;
    font-size: 0.6875rem; font-weight: 600; padding: 2px 7px; border-radius: 10px;
  }
  .sidebar-footer {
    padding: 12px 16px; border-top: 1px solid var(--color-surface-3); flex-shrink: 0;
  }
  .user-chip { display: flex; align-items: center; gap: 10px; }
  .username { font-size: 0.8125rem; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
