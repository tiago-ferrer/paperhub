<script lang="ts">
  import { Upload } from 'lucide-svelte'

  interface Props {
    onfile?: (file: File) => void
    accept?: string
    loading?: boolean
  }
  let { onfile, accept = '*', loading = false }: Props = $props()

  let fileInput: HTMLInputElement

  function handleChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) onfile?.(file)
  }
</script>

<div class="file-upload">
  <input
    bind:this={fileInput}
    type="file"
    {accept}
    onchange={handleChange}
    style="display:none"
    id="file-input"
  />
  <label for="file-input" class="upload-btn" class:loading>
    {#if loading}
      <span class="spinner"></span> Uploading…
    {:else}
      <Upload size={16} /> Choose file
    {/if}
  </label>
</div>

<style>
  .upload-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 6px; cursor: pointer;
    background: var(--color-surface-1); border: 1px dashed var(--color-surface-3);
    font-size: 14px; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .upload-btn:hover { background: var(--color-surface-2); }
  .upload-btn.loading { opacity: 0.7; pointer-events: none; }
  .spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid currentColor; border-top-color: transparent;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
