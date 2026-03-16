<script lang="ts">
  import { authApi } from '$lib/api/auth'
  import { ApiError } from '$lib/api/client'
  import Button from '$lib/components/ui/Button.svelte'
  import FormField from '$lib/components/forms/FormField.svelte'

  let email      = $state('')
  let error      = $state<string | null>(null)
  let fieldError = $state<string | null>(null)
  let loading    = $state(false)
  let submitted  = $state(false)

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    error = null
    fieldError = null
    loading = true
    try {
      await authApi.forgotPassword({ email })
      submitted = true
    } catch (err) {
      if (err instanceof ApiError && err.code === 'Validation failed' && err.fields?.email) {
        fieldError = err.fields.email
      } else {
        error = 'Something went wrong. Please try again.'
      }
    } finally {
      loading = false
    }
  }
</script>

<h2 class="title">Reset your password</h2>

{#if submitted}
  <div class="confirmation">
    If an account with that email exists, you'll receive a reset link shortly. Check your spam folder if you don't see it.
  </div>
  <p class="footer"><a href="/login">Back to login</a></p>
{:else}
  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  <form onsubmit={submit} class="form">
    <FormField label="Email" required error={fieldError}>
      <input type="email" bind:value={email} required autocomplete="email" />
    </FormField>

    <Button type="submit" {loading} disabled={!email}>Send reset link</Button>
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
  .confirmation {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    color: var(--color-text-primary); padding: 14px 16px; border-radius: 6px;
    font-size: 0.875rem; line-height: 1.5; margin-bottom: 20px;
  }
  .form { display: flex; flex-direction: column; gap: 16px; }
  .form :global(.btn) { width: 100%; justify-content: center; }
  .footer { font-size: 0.875rem; color: var(--color-text-secondary); margin-top: 20px; text-align: center; }
  .footer a { color: var(--color-primary); text-decoration: none; }
</style>
