<script lang="ts">
  import type { Snippet } from 'svelte'
  interface Props {
    title?: string
    message?: string
    actions?: Snippet
  }
  let { title = 'No records found', message = '', actions }: Props = $props()
</script>

<div class="empty-state">
  <div class="icon">📭</div>
  <h3 class="title">{title}</h3>
  {#if message}<p class="msg">{message}</p>{/if}
  {#if actions}<div class="actions">{@render actions()}</div>{/if}
</div>

<style>
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 64px 24px; text-align: center; gap: 8px;
  }
  .icon { font-size: 48px; }
  .title { font-size: 18px; font-weight: 500; color: var(--color-text-primary); margin: 0; }
  .msg { font-size: 14px; color: var(--color-text-secondary); margin: 0; }
  .actions { margin-top: 16px; }
</style>
