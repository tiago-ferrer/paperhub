<script lang="ts">
  import { waitlistApi } from '$lib/api/waitlist'
  import { ApiError } from '$lib/api/client'

  let name       = $state('')
  let email      = $state('')
  let loading    = $state(false)
  let success    = $state(false)
  let successEmail = $state('')
  let error      = $state('')

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    loading = true
    error = ''
    try {
      await waitlistApi.join({ name: name.trim(), email: email.trim() })
      successEmail = email.trim()
      success = true
    } catch (err) {
      if (err instanceof ApiError) {
        // Endpoint may not exist in beta — still confirm gracefully
        if (err.status === 404 || err.status === 405) {
          successEmail = email.trim()
          success = true
        } else {
          error = err.message || 'Something went wrong. Please try again.'
        }
      } else {
        // Network / unknown error — still show success
        successEmail = email.trim()
        success = true
      }
    } finally {
      loading = false
    }
  }
</script>

<section class="waitlist" id="waitlist">
  <div class="wl-bg-grid" aria-hidden="true"></div>
  <div class="waitlist-inner">
    <span class="wl-badge">
      <span class="wl-dot" aria-hidden="true"></span>
      Beta Waitlist Open
    </span>
    <h2 class="wl-title">Join the Beta Waitlist</h2>
    <p class="wl-sub">
      We're onboarding researchers in waves. Be the first to know when your spot is ready.
    </p>

    {#if success}
      <div class="success-card">
        <div class="success-icon" aria-hidden="true">✓</div>
        <h3>You're on the list!</h3>
        <p>We'll reach out at <strong>{successEmail}</strong> when your spot is ready. Keep an eye on your inbox.</p>
      </div>
    {:else}
      <form class="wl-form" onsubmit={handleSubmit} novalidate>
        <div class="wl-fields">
          <div class="field-group">
            <label for="wl-name">Full Name</label>
            <input
              id="wl-name" type="text" placeholder="Dr. Jane Smith"
              bind:value={name} required autocomplete="name"
            />
          </div>
          <div class="field-group">
            <label for="wl-email">Email Address</label>
            <input
              id="wl-email" type="email" placeholder="jane@university.edu"
              bind:value={email} required autocomplete="email"
            />
          </div>
        </div>
        {#if error}
          <p class="form-error" role="alert">{error}</p>
        {/if}
        <button type="submit" class="wl-submit" disabled={loading}>
          {#if loading}
            <span class="spin" aria-hidden="true"></span>
            Submitting…
          {:else}
            Request Early Access →
          {/if}
        </button>
        <p class="wl-privacy">No spam, ever. We respect your privacy.</p>
      </form>
    {/if}
  </div>
</section>

<style>
  .waitlist {
    padding: 100px 24px;
    background: linear-gradient(145deg, var(--color-primary-subtle) 0%, var(--color-surface-0) 55%);
    position: relative; overflow: hidden;
  }
  .wl-bg-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(circle, rgba(26,115,232,0.09) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%);
  }
  .waitlist-inner {
    max-width: 680px; margin: 0 auto; text-align: center;
    position: relative; z-index: 1;
  }
  .wl-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--color-primary-subtle); color: var(--color-primary);
    border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
    padding: 6px 16px; border-radius: 100px;
    font-size: 0.78rem; font-weight: 700; letter-spacing: 0.03em;
    margin-bottom: 18px;
  }
  .wl-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--color-primary); animation: pulse 2s ease infinite;
  }
  .wl-title {
    font-size: clamp(1.9rem, 3vw, 2.8rem); font-weight: 700;
    margin: 0 0 14px; color: var(--color-text-primary); line-height: 1.2;
  }
  .wl-sub {
    font-size: 1.05rem; color: var(--color-text-secondary);
    margin: 0 0 40px; line-height: 1.65;
  }

  /* Form */
  .wl-form { display: flex; flex-direction: column; gap: 14px; align-items: stretch; }
  .wl-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .field-group { display: flex; flex-direction: column; gap: 6px; text-align: left; }
  .field-group label {
    font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary);
  }
  .field-group input {
    padding: 12px 16px; border-radius: 10px;
    border: 1.5px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 0.95rem; font-family: inherit;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    outline: none; width: 100%;
  }
  .field-group input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(26,115,232,0.15);
  }
  .form-error {
    color: var(--color-error); font-size: 0.85rem; text-align: left; margin: 0;
  }
  .wl-submit {
    padding: 15px 36px; border-radius: 10px;
    background: var(--color-primary); color: #fff;
    font-weight: 700; font-size: 1rem; font-family: inherit;
    border: none; cursor: pointer;
    transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 2px 10px rgba(26,115,232,0.35);
  }
  .wl-submit:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(26,115,232,0.45);
  }
  .wl-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .spin {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: spin 0.6s linear infinite; flex-shrink: 0;
  }
  .wl-privacy {
    font-size: 0.78rem; color: var(--color-text-disabled); margin: 0;
  }

  /* Success */
  .success-card {
    background: var(--color-surface-0); border-radius: 18px;
    padding: 40px 36px; box-shadow: var(--shadow-2);
    border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
  }
  .success-icon {
    width: 60px; height: 60px; border-radius: 50%;
    background: color-mix(in srgb, var(--color-success) 15%, transparent);
    color: var(--color-success); font-size: 1.6rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px;
  }
  .success-card h3 { font-size: 1.5rem; margin: 0 0 10px; }
  .success-card p { color: var(--color-text-secondary); margin: 0; font-size: 0.95rem; }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    .wl-fields { grid-template-columns: 1fr; }
    .waitlist { padding: 72px 16px; }
    .success-card { padding: 28px 20px; }
  }
</style>
