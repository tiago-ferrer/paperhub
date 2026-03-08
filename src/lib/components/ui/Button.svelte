<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    variant?: 'filled' | 'outlined' | 'text' | 'tonal'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
    onclick?: (e: MouseEvent) => void
    children: Snippet
  }

  let {
    variant = 'filled',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    onclick,
    children,
  }: Props = $props()
</script>

<button
  {type}
  disabled={disabled || loading}
  class="btn btn-{variant} btn-{size}"
  {onclick}
>
  {#if loading}
    <span class="spinner" aria-hidden="true"></span>
  {/if}
  {@render children()}
</button>

<style>
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border-radius: 6px; border: none; cursor: pointer; font-family: inherit;
    font-weight: 500; transition: background var(--transition-standard), opacity var(--transition-standard);
    white-space: nowrap;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-md { padding: 8px 16px; font-size: 14px; }
  .btn-lg { padding: 10px 20px; font-size: 16px; }

  .btn-filled {
    background: var(--color-primary); color: var(--color-text-inverse);
  }
  .btn-filled:hover:not(:disabled) { background: var(--color-primary-hover); }

  .btn-outlined {
    background: transparent; color: var(--color-primary);
    border: 1px solid var(--color-primary);
  }
  .btn-outlined:hover:not(:disabled) { background: var(--color-primary-subtle); }

  .btn-tonal {
    background: var(--color-primary-subtle); color: var(--color-primary);
  }
  .btn-tonal:hover:not(:disabled) { background: color-mix(in srgb, var(--color-primary) 20%, transparent); }

  .btn-text {
    background: transparent; color: var(--color-primary);
  }
  .btn-text:hover:not(:disabled) { background: var(--color-primary-subtle); }

  .btn-danger {
    background: var(--color-error); color: var(--color-text-inverse);
  }
  .btn-danger:hover:not(:disabled) { background: color-mix(in srgb, var(--color-error) 85%, black); }

  .spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid currentColor; border-top-color: transparent;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
