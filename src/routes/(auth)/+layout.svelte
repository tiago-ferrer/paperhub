<script lang="ts">
  import type { Snippet } from 'svelte'
  let { children }: { children: Snippet } = $props()
</script>

<div class="auth-shell">
  <div class="auth-card">
    <div class="auth-logo">PaperHub</div>
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
    font-size: 24px; font-weight: 700; color: var(--color-primary);
    margin-bottom: 32px; text-align: center;
  }
</style>
