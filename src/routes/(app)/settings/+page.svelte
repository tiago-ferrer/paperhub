<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/ui'
  import { currentUser, currentEmail } from '$lib/stores/auth'
  import { authApi } from '$lib/api/auth'
  import { ApiError } from '$lib/api/client'
  import { Sun, Moon } from 'lucide-svelte'

  // 'idle' | 'sending' | 'token' | 'success'
  type PwStep = 'idle' | 'sending' | 'token' | 'success'

  let pwStep        = $state<PwStep>('idle')
  let token         = $state('')
  let newPassword   = $state('')
  let confirmPw     = $state('')
  let showPw        = $state(false)
  let pwLoading     = $state(false)
  let pwError       = $state<string | null>(null)
  let fieldErrors   = $state<Record<string, string>>({})

  async function startChange() {
    pwError = null
    pwStep = 'sending'
    try {
      await authApi.forgotPassword({ email: $currentEmail! })
      pwStep = 'token'
    } catch {
      pwError = 'Failed to send reset email. Please try again.'
      pwStep = 'idle'
    }
  }

  function cancel() {
    pwStep = 'idle'
    token = ''
    newPassword = ''
    confirmPw = ''
    showPw = false
    pwError = null
    fieldErrors = {}
  }

  async function submitReset(e: SubmitEvent) {
    e.preventDefault()
    fieldErrors = {}
    pwError = null

    if (newPassword.length < 8) {
      fieldErrors = { newPassword: 'Password must be at least 8 characters' }
      return
    }
    if (newPassword !== confirmPw) {
      fieldErrors = { confirmPw: 'Passwords do not match' }
      return
    }

    pwLoading = true
    try {
      await authApi.resetPassword({ token, new_password: newPassword })
      pwStep = 'success'
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'Invalid or expired token') {
          pwError = 'This token is invalid or has expired. Request a new one.'
        } else if (err.fields?.new_password) {
          fieldErrors = { newPassword: err.fields.new_password }
        } else {
          pwError = 'Something went wrong. Please try again.'
        }
      } else {
        pwError = 'Something went wrong. Please try again.'
      }
    } finally {
      pwLoading = false
    }
  }
</script>

<div class="page">
  <h1>Settings</h1>

  <div class="card">
    <h2 class="section-title">Account</h2>
    <div class="setting-row">
      <span class="label">Username</span>
      <span class="value">{$currentUser}</span>
    </div>
    <div class="divider"></div>
    <div class="setting-row">
      <span class="label">Email</span>
      <span class="value">{$currentEmail ?? '—'}</span>
    </div>
    <div class="divider"></div>

    {#if pwStep === 'idle'}
      <div class="setting-row">
        <div>
          <span class="label">Password</span>
          <span class="hint">A reset link will be sent to your email</span>
        </div>
        <button class="action-btn" onclick={startChange}>Change password</button>
      </div>
      {#if pwError}
        <div class="banner error">{pwError}</div>
      {/if}

    {:else if pwStep === 'sending'}
      <div class="setting-row">
        <span class="label">Password</span>
        <span class="value muted">Sending reset link…</span>
      </div>

    {:else if pwStep === 'token'}
      <div class="pw-panel">
        <div class="pw-panel-header">
          <span class="label">Change password</span>
          <button class="cancel-btn" onclick={cancel}>Cancel</button>
        </div>
        <div class="banner info">Reset link sent to <strong>{$currentEmail}</strong>. Paste the token from the email below.</div>

        {#if pwError}
          <div class="banner error">{pwError}</div>
        {/if}

        <form onsubmit={submitReset} class="pw-form">
          <div class="field-wrap">
            <label class="field-label">Token from email</label>
            <input type="text" bind:value={token} required placeholder="Paste token here" autocomplete="off" />
          </div>

          <div class="field-wrap">
            <label class="field-label">New password</label>
            <div class="pw-input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                bind:value={newPassword}
                required
                minlength="8"
                autocomplete="new-password"
                class:field-invalid={!!fieldErrors.newPassword}
              />
              <button type="button" class="show-toggle" onclick={() => (showPw = !showPw)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {#if fieldErrors.newPassword}
              <span class="field-error">{fieldErrors.newPassword}</span>
            {/if}
          </div>

          <div class="field-wrap">
            <label class="field-label">Confirm password</label>
            <input
              type={showPw ? 'text' : 'password'}
              bind:value={confirmPw}
              required
              autocomplete="new-password"
              class:field-invalid={!!fieldErrors.confirmPw}
            />
            {#if fieldErrors.confirmPw}
              <span class="field-error">{fieldErrors.confirmPw}</span>
            {/if}
          </div>

          <div class="pw-actions">
            <button type="submit" class="action-btn primary" disabled={!token || !newPassword || !confirmPw || pwLoading}>
              {pwLoading ? 'Saving…' : 'Set new password'}
            </button>
          </div>
        </form>
      </div>

    {:else if pwStep === 'success'}
      <div class="setting-row">
        <span class="label">Password</span>
        <div class="success-row">
          <span class="success-msg">Password updated successfully</span>
          <button class="cancel-btn" onclick={cancel}>Done</button>
        </div>
      </div>
    {/if}
  </div>

  <div class="card">
    <h2 class="section-title">Appearance</h2>
    <div class="setting-row">
      <div>
        <span class="label">Theme</span>
        <span class="hint">Toggle between light and dark mode</span>
      </div>
      <button class="theme-toggle" onclick={toggleTheme}>
        {#if $theme === 'dark'}
          <Sun size={23} /> Light
        {:else}
          <Moon size={23} /> Dark
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .page { max-width: 100%; }
  h1 { margin: 0 0 24px; font-size: 1.75rem; font-weight: 400; }
  .card { background: var(--color-surface-0); border: 1px solid var(--color-surface-3); border-radius: 12px; padding: 24px; margin-bottom: 20px; }
  .section-title { font-size: 1rem; font-weight: 500; margin: 0 0 16px; }
  .setting-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; }
  .label { color: var(--color-text-primary); font-weight: 500; display: block; }
  .hint { font-size: 0.75rem; color: var(--color-text-secondary); display: block; }
  .value { color: var(--color-text-secondary); }
  .value.muted { opacity: 0.5; }
  .divider { height: 1px; background: var(--color-surface-3); margin: 16px 0; }

  .action-btn {
    padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); cursor: pointer; font-size: 0.8125rem;
    color: var(--color-text-primary); white-space: nowrap;
  }
  .action-btn:hover:not(:disabled) { background: var(--color-surface-2); }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-btn.primary {
    background: var(--color-primary); color: #fff; border-color: var(--color-primary);
  }
  .action-btn.primary:hover:not(:disabled) { opacity: 0.9; background: var(--color-primary); }

  .cancel-btn {
    background: none; border: none; cursor: pointer; font-size: 0.8125rem;
    color: var(--color-text-secondary); padding: 4px 8px; border-radius: 6px;
  }
  .cancel-btn:hover { background: var(--color-surface-2); }

  .banner {
    margin-top: 12px; padding: 10px 14px; border-radius: 8px; font-size: 0.8125rem; line-height: 1.5;
  }
  .banner.error { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }
  .banner.info  { background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-text-primary); }

  .pw-panel { display: flex; flex-direction: column; gap: 12px; }
  .pw-panel-header { display: flex; align-items: center; justify-content: space-between; }
  .pw-form { display: flex; flex-direction: column; gap: 12px; }
  .pw-actions { display: flex; justify-content: flex-end; }

  .field-wrap { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 0.8125rem; color: var(--color-text-secondary); }
  .field-wrap input {
    width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 0.875rem;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1);
    color: var(--color-text-primary); box-sizing: border-box;
  }
  .field-wrap input:focus { outline: none; border-color: var(--color-primary); }
  .field-wrap input.field-invalid { border-color: var(--color-error); }
  .field-error { font-size: 0.75rem; color: var(--color-error); }

  .pw-input-wrap { position: relative; }
  .pw-input-wrap input { padding-right: 52px; }
  .show-toggle {
    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; font-size: 0.75rem;
    color: var(--color-primary); padding: 0; font-family: inherit;
  }

  .success-row { display: flex; align-items: center; gap: 12px; }
  .success-msg { font-size: 0.8125rem; color: var(--color-primary); }

  .theme-toggle {
    display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px;
    border: 1px solid var(--color-surface-3); background: var(--color-surface-1); cursor: pointer;
    font-size: 0.875rem; color: var(--color-text-primary);
  }
  .theme-toggle:hover { background: var(--color-surface-2); }
</style>
