<section class="social">
  <div class="social-inner">
    <div class="stats">
      <div class="stat">
        <span class="stat-num">200+</span>
        <span class="stat-label">Researchers</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat">
        <span class="stat-num">4</span>
        <span class="stat-label">Integrated Tools</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat">
        <span class="stat-num">Beta</span>
        <span class="stat-label">Currently Live</span>
      </div>
    </div>
    <figure class="quote-wrap">
      <blockquote class="quote">
        <p>"Scholaflow finally lets me keep my notes, papers, and transcriptions in one place. It's the research hub I didn't know I needed."</p>
      </blockquote>
      <figcaption class="quote-attr">
        <div class="quote-avatar">P</div>
        <div>
          <strong>Beta Tester</strong>
          <span>PhD Candidate, Computational Biology</span>
        </div>
      </figcaption>
    </figure>
  </div>
</section>

<style>
  .social {
    background: var(--color-surface-1);
    border-top: 1px solid var(--color-surface-3);
    border-bottom: 1px solid var(--color-surface-3);
    padding: 80px 24px;
  }
  .social-inner {
    max-width: 900px; margin: 0 auto; text-align: center;
  }
  .stats {
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 56px; flex-wrap: wrap; gap: 0;
  }
  .stat { padding: 0 44px; }
  .stat-num {
    display: block; font-size: 2.6rem; font-weight: 700;
    color: var(--color-primary); line-height: 1;
  }
  .stat-label {
    display: block; font-size: 0.85rem; color: var(--color-text-secondary);
    margin-top: 6px; font-weight: 500;
  }
  .stat-divider {
    width: 1px; height: 52px;
    background: var(--color-surface-3);
  }
  .quote-wrap {
    margin: 0; padding: 0;
    max-width: 640px; margin: 0 auto; text-align: left;
    background: var(--color-surface-0);
    border-radius: 16px; padding: 32px 36px;
    box-shadow: var(--shadow-1);
    border: 1px solid var(--color-surface-3);
    position: relative;
  }
  .quote-wrap::before {
    content: '"';
    position: absolute; top: 16px; left: 28px;
    font-size: 5rem; line-height: 1;
    color: var(--color-primary-subtle); font-family: Georgia, serif;
    pointer-events: none;
  }
  .quote p {
    font-size: 1.08rem; font-style: italic;
    color: var(--color-text-primary);
    margin: 0 0 20px; line-height: 1.65;
    position: relative; z-index: 1;
  }
  .quote-attr {
    display: flex; align-items: center; gap: 12px;
  }
  .quote-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: var(--color-primary); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
  }
  .quote-attr strong {
    display: block; font-size: 0.9rem; color: var(--color-text-primary);
  }
  .quote-attr span {
    display: block; font-size: 0.8rem; color: var(--color-text-secondary);
    margin-top: 2px;
  }

  @media (max-width: 600px) {
    .stats { flex-direction: column; gap: 28px; }
    .stat { padding: 0; }
    .stat-divider { width: 48px; height: 1px; }
    .quote-wrap { padding: 24px 20px; }
    .social { padding: 64px 16px; }
  }
</style>
