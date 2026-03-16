<script lang="ts">
  import { goto } from '$app/navigation'
  import { authApi } from '$lib/api/auth'
  import { authStore } from '$lib/stores/auth'
  import { ApiError } from '$lib/api/client'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'

  let username = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let loading = $state(false)

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    error = null
    loading = true
    try {
      const res = await authApi.login({ username, password })
      authStore.login(res.token, username)
      goto('/dashboard')
    } catch (err) {
      error = err instanceof ApiError ? err.message : 'Login failed'
    } finally {
      loading = false
    }
  }
</script>

<h2 class="title">Sign in</h2>

{#if error}
  <div class="error-banner">{error}</div>
{/if}

<form onsubmit={submit} class="form">
  <FormField label="Username" required>
    <input type="text" bind:value={username} required autocomplete="username" />
  </FormField>

  <FormField label="Password" required>
    <input type="password" bind:value={password} required autocomplete="current-password" />
  </FormField>

  <div class="forgot-link"><a href="/forgot-password">Forgot password?</a></div>

  <Button type="submit" {loading} disabled={!username || !password}>Sign in</Button>
</form>

<p class="footer">Don't have an account? <a href="/register">Register</a></p>

<style>
  .title { font-size: 1.375rem; font-weight: 400; margin: 0 0 24px; }
  .error-banner {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
    color: var(--color-error); padding: 10px 14px; border-radius: 6px;
    font-size: 0.875rem; margin-bottom: 16px;
  }
  .form { display: flex; flex-direction: column; gap: 16px; }
  .form :global(.btn) { width: 100%; justify-content: center; }
  .footer { font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 20px; text-align: center; }
  .footer a { color: var(--color-primary); text-decoration: none; }
  .forgot-link { text-align: right; margin-top: -8px; }
  .forgot-link a { font-size: 0.8125rem; color: var(--color-text-secondary); text-decoration: none; }
  .forgot-link a:hover { color: var(--color-primary); }
</style>
