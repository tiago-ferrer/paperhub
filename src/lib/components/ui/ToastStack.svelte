<script lang="ts">
  import { toast } from '$lib/stores/toast'
  import { fly } from 'svelte/transition'
  import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-svelte'

  const icons = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle }
</script>

<div class="toast-stack" aria-live="polite">
  {#each $toast as t (t.id)}
    <div class="toast toast-{t.kind}" transition:fly={{ y: 20, duration: 200 }}>
      <svelte:component this={icons[t.kind]} size={18} />
      <span>{t.message}</span>
    </div>
  {/each}
</div>

<style>
  .toast-stack {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    display: flex; flex-direction: column; gap: 8px; max-width: 400px;
  }
  .toast {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 8px;
    font-size: 14px; font-weight: 500;
    box-shadow: var(--shadow-2);
    color: white;
  }
  .toast-success { background: var(--color-success); }
  .toast-error   { background: var(--color-error); }
  .toast-warning { background: var(--color-warning); color: #202124; }
  .toast-info    { background: var(--color-info); }
</style>
