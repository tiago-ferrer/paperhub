<script lang="ts">
  import { page } from '$app/stores'
</script>

<div class="error-page">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message}</p>
  <a href="/dashboard">Back to Dashboard</a>
</div>

<style>
  .error-page {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; gap: 16px;
  }
  h1 { font-size: 72px; margin: 0; color: var(--color-text-secondary, #5f6368); }
  p  { font-size: 18px; color: var(--color-text-secondary, #5f6368); }
  a  { color: var(--color-primary, #1a73e8); text-decoration: none; }
</style>
