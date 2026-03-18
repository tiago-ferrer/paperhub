<footer class="landing-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo">
        <span class="logo-schola">schola</span><span class="logo-flow">flow</span>
      </div>
      <span class="footer-beta-badge">Beta</span>
      <p class="footer-tagline">Research | Share | Connect</p>
    </div>
    <nav class="footer-links" aria-label="Footer navigation">
      <a href="/privacy-terms">Privacy &amp; Terms</a>
      <a href="/login">Login</a>
      <a href="#waitlist">Join Waitlist</a>
    </nav>
    <p class="footer-copy">© 2026 Scholaflow. All rights reserved.</p>
  </div>
</footer>

<style>
  .landing-footer {
    background: var(--color-surface-2);
    border-top: 1px solid var(--color-surface-3);
    padding: 48px 24px 32px;
  }
  .footer-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 20px;
  }
  .footer-brand {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .footer-logo { font-size: 1.35rem; }
  .logo-schola { color: #447EE2; }
  .logo-flow   { color: #596772; }
  :global([data-theme="dark"]) .logo-flow { color: #ffffff; }
  .footer-beta-badge {
    display: inline-block; padding: 3px 8px; border-radius: 5px;
    background: var(--color-primary-subtle); color: var(--color-primary);
    font-size: 0.68rem; letter-spacing: 0.05em;
  }
  .footer-tagline {
    width: 100%; font-size: 0.78rem; color: var(--color-text-disabled);
    margin: 0; letter-spacing: 0.06em;
  }
  .footer-links {
    display: flex; gap: 24px; align-items: center;
  }
  .footer-links a {
    font-size: 0.875rem; color: var(--color-text-secondary); text-decoration: none;
    transition: color 150ms ease;
  }
  .footer-links a:hover { color: var(--color-primary); }
  .footer-copy { font-size: 0.78rem; color: var(--color-text-disabled); margin: 0; }

  @media (max-width: 640px) {
    .footer-inner { flex-direction: column; text-align: center; }
    .footer-brand { justify-content: center; }
    .footer-links { justify-content: center; }
  }
</style>
