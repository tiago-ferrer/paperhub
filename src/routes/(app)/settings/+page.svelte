<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/ui'
  import { currentUser } from '$lib/stores/auth'
  import { Sun, Moon } from 'lucide-svelte'
</script>

<div class="page">
  <h1>Settings</h1>

  <div class="card">
    <h2 class="section-title">Account</h2>
    <div class="setting-row">
      <span class="label">Username</span>
      <span class="value">{$currentUser}</span>
    </div>
  </div>

  <div class="card">
    <h2 class="section-title">Appearance</h2>
    <div class="setting-row">
      <div>
        <span class="label">Theme</span>
        <span class="hint">Toggle between light and dark mode</span>
      </div>
      <button class="theme-toggle" onclick={toggleTheme}>
        {#if $theme === 'dark'}
          <Sun size={18} /> Light
        {:else}
          <Moon size={18} /> Dark
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .page { max-width: 600px; }
  h1 { margin: 0 0 24px; font-size: 28px; font-weight: 400; }
  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
  .section-title { font-size: 16px; font-weight: 500; margin: 0 0 16px; }
  .setting-row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
  .label { color: var(--color-text-primary); font-weight: 500; display: block; }
  .hint { font-size: 12px; color: var(--color-text-secondary); display: block; }
  .value { color: var(--color-text-secondary); }
  .theme-toggle {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1); cursor: pointer;
    font-size: 14px; color: var(--color-text-primary);
  }
  .theme-toggle:hover { background: var(--color-surface-2); }
</style>
