<script lang="ts">
  import { toast } from '$lib/stores/toast'
  import { fly } from 'svelte/transition'
  import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-svelte'

  const icons = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle }
</script>

<div class="toast-stack" aria-live="polite">
  {#each $toast as t (t.id)}
    <div class="toast toast-{t.kind}" transition:fly={{ y: 20, duration: 200 }}>
      <svelte:component this={icons[t.kind]} size={20} class="toast-icon" />
      <span class="toast-msg">{t.message}</span>
      {#if t.action}
        <button class="toast-action" onclick={() => t.action!.onClick()}>{t.action.label}</button>
      {/if}
      <button class="toast-close" onclick={() => toast.dismiss(t.id)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-stack {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    display: flex; flex-direction: column; gap: 8px; max-width: 440px;
  }
  .toast {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 8px;
    font-size: 0.875rem; font-weight: 500;
    box-shadow: var(--shadow-2);
    color: white;
  }
  .toast-success { background: var(--color-success); }
  .toast-error   { background: var(--color-error); }
  .toast-warning { background: var(--color-warning); color: #202124; }
  .toast-info    { background: var(--color-info); }

  .toast-msg { flex: 1; }

  .toast-action {
    flex-shrink: 0;
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.35);
    color: inherit;
    border-radius: 5px;
    padding: 3px 10px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .toast-action:hover { background: rgba(255,255,255,0.3); }
  .toast-warning .toast-action { border-color: rgba(0,0,0,0.2); background: rgba(0,0,0,0.08); }
  .toast-warning .toast-action:hover { background: rgba(0,0,0,0.15); }

  .toast-close {
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    width: 22px; height: 22px;
    background: transparent; border: none; cursor: pointer;
    color: inherit; opacity: 0.7;
    border-radius: 4px;
    transition: opacity 0.15s, background 0.15s;
    padding: 0;
  }
  .toast-close:hover { opacity: 1; background: rgba(255,255,255,0.15); }
  .toast-warning .toast-close:hover { background: rgba(0,0,0,0.08); }
</style>
