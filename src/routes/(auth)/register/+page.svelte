<script lang="ts">
  import { goto } from '$app/navigation'
  import { authApi } from '$lib/api/auth'
  import { ApiError } from '$lib/api/client'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'

  let username = $state('')
  let email    = $state('')
  let password = $state('')
  let error    = $state<string | null>(null)
  let loading  = $state(false)

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    error = null
    loading = true
    try {
      await authApi.register({ username, email, password })
      goto('/login')
    } catch (err) {
      error = err instanceof ApiError ? err.message : 'Registration failed'
    } finally {
      loading = false
    }
  }
</script>

<h2 class="title">Create account</h2>

{#if error}
  <div class="error-banner">{error}</div>
{/if}

<form onsubmit={submit} class="form">
  <FormField label="Username" required>
    <input type="text" bind:value={username} required autocomplete="username" />
  </FormField>

  <FormField label="Email" required>
    <input type="email" bind:value={email} required autocomplete="email" />
  </FormField>

  <FormField label="Password" required>
    <input type="password" bind:value={password} required autocomplete="new-password" minlength="8" />
  </FormField>

  <Button type="submit" {loading} disabled={!username || !email || !password}>Create account</Button>
</form>

<p class="footer">Already have an account? <a href="/login">Sign in</a></p>

<style>
  .title { font-size: 22px; font-weight: 400; margin: 0 0 24px; }
  .error-banner {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
    color: var(--color-error); padding: 10px 14px; border-radius: 6px;
    font-size: 14px; margin-bottom: 16px;
  }
  .form { display: flex; flex-direction: column; gap: 16px; }
  .form :global(.btn) { width: 100%; justify-content: center; }
  .footer { font-size: 14px; color: var(--color-text-secondary); margin-top: 20px; text-align: center; }
  .footer a { color: var(--color-primary); text-decoration: none; }
</style>
