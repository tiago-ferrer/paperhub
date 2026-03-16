<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { authApi } from '$lib/api/auth'
  import { ApiError } from '$lib/api/client'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'

  const token = $derived(page.url.searchParams.get('token') ?? '')

  let newPassword     = $state('')
  let confirmPassword = $state('')
  let showPassword    = $state(false)
  let showConfirm     = $state(false)
  let error           = $state<'expired_token' | 'generic' | null>(null)
  let fieldErrors     = $state<Record<string, string>>({})
  let loading         = $state(false)
  let success         = $state(false)

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters'
    if (confirmPassword !== newPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    error = null
    fieldErrors = {}

    const errors = validate()
    if (Object.keys(errors).length) {
      fieldErrors = errors
      return
    }

    loading = true
    try {
      await authApi.resetPassword({ token, new_password: newPassword })
      success = true
      setTimeout(() => goto('/login'), 2000)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'Invalid or expired token') {
          error = 'expired_token'
        } else if (err.code === 'Validation failed' && err.fields) {
          const fe: Record<string, string> = {}
          if (err.fields.new_password) fe.newPassword = err.fields.new_password
          fieldErrors = fe
        } else {
          error = 'generic'
        }
      } else {
        error = 'generic'
      }
    } finally {
      loading = false
    }
  }
</script>

<h2 class="title">Set new password</h2>

{#if !token}
  <div class="error-banner">
    This reset link is invalid. Please <a href="/forgot-password">request a new one</a>.
  </div>
{:else if success}
  <div class="success-banner">
    Your password has been reset. Redirecting to login…
  </div>
  <p class="footer"><a href="/login">Go to login</a></p>
{:else}
  {#if error === 'expired_token'}
    <div class="error-banner">
      This reset link has expired or is no longer valid. Please <a href="/forgot-password">request a new one</a>.
    </div>
  {:else if error === 'generic'}
    <div class="error-banner">Something went wrong. Please try again.</div>
  {/if}

  <p class="hint-text">This link expires 30 minutes after it was sent.</p>

  <form onsubmit={submit} class="form">
    <FormField label="New password" required error={fieldErrors.newPassword}>
      <div class="password-wrap">
        <input
          type={showPassword ? 'text' : 'password'}
          bind:value={newPassword}
          required
          autocomplete="new-password"
          minlength="8"
        />
        <button type="button" class="show-toggle" onclick={() => (showPassword = !showPassword)}>
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </FormField>

    <FormField label="Confirm password" required error={fieldErrors.confirmPassword}>
      <div class="password-wrap">
        <input
          type={showConfirm ? 'text' : 'password'}
          bind:value={confirmPassword}
          required
          autocomplete="new-password"
        />
        <button type="button" class="show-toggle" onclick={() => (showConfirm = !showConfirm)}>
          {showConfirm ? 'Hide' : 'Show'}
        </button>
      </div>
    </FormField>

    <Button type="submit" {loading} disabled={!newPassword || !confirmPassword}>Reset password</Button>
  </form>

  <p class="footer"><a href="/login">Back to login</a></p>
{/if}

<style>
  .title { font-size: 1.375rem; font-weight: 400; margin: 0 0 24px; }
  .error-banner {
    background: color-mix(in srgb, var(--color-error) 10%, transparent);
    color: var(--color-error); padding: 10px 14px; border-radius: 6px;
    font-size: 0.875rem; margin-bottom: 16px;
  }
  .error-banner a { color: var(--color-error); }
  .success-banner {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-text-primary); padding: 14px 16px; border-radius: 6px;
    font-size: 0.875rem; line-height: 1.5; margin-bottom: 20px;
  }
  .hint-text { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 16px; }
  .form { display: flex; flex-direction: column; gap: 16px; }
  .form :global(.btn) { width: 100%; justify-content: center; }
  .footer { font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 20px; text-align: center; }
  .footer a { color: var(--color-primary); text-decoration: none; }
  .password-wrap { position: relative; width: 100%; }
  .password-wrap :global(input) { padding-right: 56px; }
  .show-toggle {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; font-size: 0.75rem;
    color: var(--color-primary); padding: 0; font-family: inherit;
  }
</style>
