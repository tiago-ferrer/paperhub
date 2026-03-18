<section class="cta-section">
  <div class="cta-glow" aria-hidden="true"></div>
  <div class="cta-inner">
    <span class="cta-badge">Limited Beta Access</span>
    <h2 class="cta-title">Ready to transform your research workflow?</h2>
    <p class="cta-sub">
      Scholaflow is currently in Beta. Join the waitlist and get early access before the public launch.
    </p>
    <div class="cta-actions">
      <a href="#waitlist" class="cta-primary">Join the Waitlist</a>
      <a href="/login" class="cta-secondary">Beta Login →</a>
    </div>
  </div>
</section>

<style>
  .cta-section {
    padding: 110px 24px;
    background: linear-gradient(160deg, #0f1b2e 0%, #1a2744 40%, #0d1520 100%);
    position: relative; overflow: hidden;
  }
  .cta-glow {
    position: absolute; top: -40%; left: 50%;
    transform: translateX(-50%);
    width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(68,126,226,0.22) 0%, transparent 65%);
    pointer-events: none;
  }
  .cta-inner {
    max-width: 720px; margin: 0 auto; text-align: center;
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center; gap: 20px;
  }
  .cta-badge {
    display: inline-block; padding: 5px 14px; border-radius: 100px;
    border: 1px solid rgba(68, 126, 226, 0.45);
    background: rgba(68, 126, 226, 0.12);
    color: #93bbfc; font-size: 0.76rem; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .cta-title {
    font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 700;
    color: #fff; margin: 0; line-height: 1.15;
  }
  .cta-sub {
    font-size: 1.1rem; color: rgba(255,255,255,0.65);
    margin: 0; line-height: 1.65; max-width: 560px;
  }
  .cta-actions {
    display: flex; gap: 14px; justify-content: center;
    flex-wrap: wrap; margin-top: 8px;
  }
  .cta-primary {
    padding: 15px 36px; border-radius: 10px;
    background: var(--color-primary); color: #fff;
    font-weight: 700; font-size: 1rem; text-decoration: none;
    transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
    box-shadow: 0 4px 20px rgba(26,115,232,0.55);
  }
  .cta-primary:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(26,115,232,0.65);
  }
  .cta-secondary {
    padding: 15px 36px; border-radius: 10px;
    border: 1.5px solid rgba(255,255,255,0.25); color: rgba(255,255,255,0.85);
    font-weight: 600; font-size: 1rem; text-decoration: none;
    transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
  }
  .cta-secondary:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.45);
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    .cta-section { padding: 72px 16px; }
  }
</style>
