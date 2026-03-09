<script lang="ts">
  import type { Snippet } from 'svelte'
  let { children }: { children: Snippet } = $props()
</script>

<div class="auth-shell">
  <div class="auth-card">
    <div class="auth-logo"><span class="logo-paper">paper</span><span class="logo-hub">hub</span></div>
    <p class="auth-tagline">Research | Share | Connect</p>
    {@render children()}
  </div>
</div>

<style>
  .auth-shell {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--color-surface-1); padding: 24px;
  }
  .auth-card {
    background: var(--color-surface-0); border-radius: 12px;
    padding: 40px; width: 100%; max-width: 400px;
    box-shadow: var(--shadow-2);
  }
  .auth-logo {
    font-size: 3.5rem;
    margin-bottom: 32px; text-align: center;
  }
  .auth-tagline {
    text-align: center; font-size: 0.96rem; font-weight: 400;
    color: #545A62; letter-spacing: 0.05em;
    margin: -20px 0 28px;
  }
  .logo-paper { color: #447EE2; }
  .logo-hub   { color: #596772; }
  :global([data-theme="dark"]) .logo-hub { color: #ffffff; }
</style>
