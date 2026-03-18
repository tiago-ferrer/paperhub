<section class="hero">
  <div class="hero-bg-grid" aria-hidden="true"></div>
  <div class="hero-inner">
    <div class="hero-content">
      <span class="beta-badge">
        <span class="beta-dot" aria-hidden="true"></span>
        Beta — Limited Access
      </span>
      <h1 class="hero-headline">
        Your Research,<br /><span class="headline-accent">Organized.</span>
      </h1>
      <p class="hero-sub">
        Scholaflow brings together notebooks, references, Kanban boards, and AI
        transcription for researchers and academics — all in one place.
      </p>
      <div class="hero-ctas">
        <a href="#waitlist" class="cta-primary">Join the Waitlist</a>
        <a href="/login" class="cta-secondary">Beta Login →</a>
      </div>
      <div class="hero-social">
        <div class="avatar-stack" aria-hidden="true">
          <div class="avatar av1">R</div>
          <div class="avatar av2">M</div>
          <div class="avatar av3">A</div>
        </div>
        <span class="social-text">Join <strong>200+</strong> researchers in beta</span>
      </div>
    </div>

    <div class="hero-mockup" aria-hidden="true">
      <div class="mockup-window">
        <div class="mockup-bar">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <div class="mockup-url-bar"></div>
        </div>
        <div class="mockup-body">
          <div class="mock-sidebar">
            <div class="mock-logo-line"></div>
            <div class="mock-nav-item active"></div>
            <div class="mock-nav-item"></div>
            <div class="mock-nav-item"></div>
            <div class="mock-nav-item short"></div>
          </div>
          <div class="mock-content">
            <div class="mock-topbar">
              <div class="mock-page-title"></div>
              <div class="mock-btn"></div>
            </div>
            <div class="mock-cards">
              <div class="mock-card">
                <div class="mock-card-label"></div>
                <div class="mock-card-line"></div>
                <div class="mock-card-line short"></div>
              </div>
              <div class="mock-card">
                <div class="mock-card-label accent"></div>
                <div class="mock-card-line"></div>
                <div class="mock-card-line short"></div>
              </div>
              <div class="mock-card">
                <div class="mock-card-label warm"></div>
                <div class="mock-card-line"></div>
                <div class="mock-card-line"></div>
              </div>
            </div>
            <div class="mock-footer-row">
              <div class="mock-chip"></div>
              <div class="mock-chip wide"></div>
              <div class="mock-chip"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    min-height: 100vh;
    display: flex; align-items: center;
    padding-top: 64px;
    position: relative; overflow: hidden;
    background:
      radial-gradient(ellipse 80% 60% at 65% 0%, rgba(26,115,232,0.10) 0%, transparent 65%),
      var(--color-surface-0);
  }
  .hero-bg-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(circle, rgba(26,115,232,0.11) 1px, transparent 1px);
    background-size: 36px 36px;
    mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black 15%, transparent 80%);
    -webkit-mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black 15%, transparent 80%);
  }
  .hero-inner {
    max-width: 1200px; margin: 0 auto; padding: 80px 24px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px;
    align-items: center; width: 100%;
    position: relative; z-index: 1;
  }
  .hero-content {
    display: flex; flex-direction: column; gap: 26px;
  }
  .beta-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--color-primary-subtle); color: var(--color-primary);
    padding: 6px 14px; border-radius: 100px;
    font-size: 0.8rem; font-weight: 700; letter-spacing: 0.02em;
    align-self: flex-start;
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
    animation: fadeUp 0.5s ease both;
  }
  .beta-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--color-primary); animation: pulse 2s ease infinite;
  }
  .hero-headline {
    font-size: clamp(2.6rem, 5vw, 4.5rem);
    font-weight: 700; line-height: 1.08;
    margin: 0; color: var(--color-text-primary);
    animation: fadeUp 0.5s 0.08s ease both;
  }
  .headline-accent { color: var(--color-primary); }
  .hero-sub {
    font-size: clamp(1rem, 2vw, 1.2rem);
    color: var(--color-text-secondary); line-height: 1.65;
    margin: 0; max-width: 520px;
    animation: fadeUp 0.5s 0.16s ease both;
  }
  .hero-ctas {
    display: flex; gap: 12px; flex-wrap: wrap;
    animation: fadeUp 0.5s 0.24s ease both;
  }
  .cta-primary {
    padding: 14px 30px; border-radius: 10px;
    background: var(--color-primary); color: #fff;
    font-weight: 600; font-size: 1rem; text-decoration: none;
    transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
    box-shadow: 0 2px 10px rgba(26,115,232,0.35);
  }
  .cta-primary:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(26,115,232,0.45);
  }
  .cta-secondary {
    padding: 14px 30px; border-radius: 10px;
    border: 1.5px solid var(--color-primary); color: var(--color-primary);
    font-weight: 600; font-size: 1rem; text-decoration: none;
    transition: background 150ms ease, transform 150ms ease;
  }
  .cta-secondary:hover {
    background: var(--color-primary-subtle);
    transform: translateY(-2px);
  }
  .hero-social {
    display: flex; align-items: center; gap: 12px;
    animation: fadeUp 0.5s 0.32s ease both;
  }
  .avatar-stack { display: flex; }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700; color: #fff;
    border: 2px solid var(--color-surface-0);
  }
  .avatar + .avatar { margin-left: -8px; }
  .av1 { background: #447EE2; }
  .av2 { background: #34a853; }
  .av3 { background: #ea4335; }
  .social-text { font-size: 0.875rem; color: var(--color-text-secondary); }

  /* Mockup */
  .hero-mockup { animation: fadeUp 0.5s 0.14s ease both; }
  .mockup-window {
    background: var(--color-surface-1);
    border-radius: 16px;
    box-shadow: var(--shadow-3), 0 24px 64px rgba(26,115,232,0.15);
    overflow: hidden;
    border: 1px solid var(--color-surface-3);
    transform: perspective(1200px) rotateY(-4deg) rotateX(2deg);
    transition: transform 400ms ease;
  }
  .mockup-window:hover {
    transform: perspective(1200px) rotateY(-1deg) rotateX(1deg);
  }
  .mockup-bar {
    background: var(--color-surface-2); padding: 10px 16px;
    display: flex; align-items: center; gap: 7px;
    border-bottom: 1px solid var(--color-surface-3);
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .dot.red    { background: #ef4444; }
  .dot.yellow { background: #f59e0b; }
  .dot.green  { background: #22c55e; }
  .mockup-url-bar {
    flex: 1; height: 20px; border-radius: 6px;
    background: var(--color-surface-3); margin-left: 8px;
  }
  .mockup-body { display: flex; height: 340px; }
  .mock-sidebar {
    width: 130px; background: var(--color-surface-2);
    padding: 16px 12px; display: flex; flex-direction: column; gap: 10px;
    border-right: 1px solid var(--color-surface-3); flex-shrink: 0;
  }
  .mock-logo-line {
    height: 18px; border-radius: 6px;
    background: color-mix(in srgb, #447EE2 25%, var(--color-surface-3));
    margin-bottom: 8px;
  }
  .mock-nav-item {
    height: 11px; border-radius: 5px;
    background: var(--color-surface-3); opacity: 0.7;
  }
  .mock-nav-item.active {
    background: var(--color-primary-subtle); opacity: 1;
  }
  .mock-nav-item.short { width: 60%; }
  .mock-content {
    flex: 1; padding: 16px 18px; display: flex; flex-direction: column; gap: 14px;
    overflow: hidden;
  }
  .mock-topbar {
    display: flex; align-items: center; justify-content: space-between;
  }
  .mock-page-title {
    height: 14px; border-radius: 7px;
    background: var(--color-surface-3); width: 38%;
  }
  .mock-btn {
    height: 26px; width: 72px; border-radius: 7px;
    background: color-mix(in srgb, var(--color-primary) 25%, var(--color-surface-3));
  }
  .mock-cards {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; flex: 1;
  }
  .mock-card {
    background: var(--color-surface-0); border-radius: 10px;
    border: 1px solid var(--color-surface-3);
    padding: 12px; box-shadow: var(--shadow-1);
    display: flex; flex-direction: column; gap: 8px;
  }
  .mock-card-label {
    height: 8px; width: 40%; border-radius: 4px;
    background: color-mix(in srgb, var(--color-primary) 30%, var(--color-surface-3));
  }
  .mock-card-label.accent {
    background: color-mix(in srgb, #34a853 30%, var(--color-surface-3));
  }
  .mock-card-label.warm {
    background: color-mix(in srgb, #f9ab00 35%, var(--color-surface-3));
  }
  .mock-card-line {
    height: 8px; border-radius: 4px; background: var(--color-surface-3);
  }
  .mock-card-line.short { width: 65%; }
  .mock-footer-row {
    display: flex; gap: 8px;
  }
  .mock-chip {
    height: 22px; width: 56px; border-radius: 100px;
    background: var(--color-primary-subtle);
  }
  .mock-chip.wide { width: 88px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }

  @media (max-width: 920px) {
    .hero-inner {
      grid-template-columns: 1fr; gap: 48px; text-align: center;
    }
    .hero-content { align-items: center; }
    .hero-sub { max-width: 100%; }
    .hero-ctas { justify-content: center; }
    .hero-social { justify-content: center; }
    .hero-mockup { max-width: 480px; margin: 0 auto; width: 100%; }
    .mockup-window { transform: none; }
    .mockup-window:hover { transform: none; }
  }
  @media (max-width: 480px) {
    .hero-inner { padding: 60px 16px; }
    .mock-cards { grid-template-columns: 1fr; }
    .mock-card:nth-child(2), .mock-card:nth-child(3) { display: none; }
  }
</style>
