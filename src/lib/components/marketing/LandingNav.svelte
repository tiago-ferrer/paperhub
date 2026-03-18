<script lang="ts">
  import { isLoggedIn } from '$lib/stores/auth'
</script>

<nav class="landing-nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo">
      <span class="logo-schola">schola</span><span class="logo-flow">flow</span>
    </a>
    <div class="nav-actions">
      {#if $isLoggedIn}
        <a href="/dashboard" class="btn-nav btn-filled">Go to Dashboard</a>
      {:else}
        <a href="/login" class="btn-nav btn-outlined">Beta Login</a>
      {/if}
    </div>
  </div>
</nav>

<style>
  .landing-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: color-mix(in srgb, var(--color-surface-0) 88%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--color-surface-3);
  }
  .nav-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-logo {
    font-size: 1.5rem; text-decoration: none;
  }
  .logo-schola { color: #447EE2; }
  .logo-flow  { color: #596772; }
  :global([data-theme="dark"]) .logo-flow { color: #ffffff; }
  .btn-nav {
    padding: 9px 22px; border-radius: 8px; font-size: 0.9rem;
    font-weight: 600; text-decoration: none;
    transition: all 150ms ease; white-space: nowrap;
  }
  .btn-filled {
    background: var(--color-primary); color: #fff;
  }
  .btn-filled:hover { background: var(--color-primary-hover); }
  .btn-outlined {
    border: 1.5px solid var(--color-primary); color: var(--color-primary);
  }
  .btn-outlined:hover { background: var(--color-primary-subtle); }
</style>
