<script lang="ts">
  import { CheckCircle2 } from 'lucide-svelte'

  const rows = [
    {
      eyebrow: 'Notebooks',
      title: 'Write, Think, Discover',
      description:
        'A powerful research notebook with full Markdown and LaTeX math rendering. Attach files, link papers, and keep every idea organized.',
      bullets: [
        'Inline and block LaTeX math ($...$ and $$...$$)',
        'File attachments directly on posts',
        'Link academic references to notes',
        'Archive toggle with soft-delete',
      ],
      color: '#447EE2',
      bgGradient: 'linear-gradient(140deg, #e8f0fe 0%, #c5d8fd 100%)',
      accentBg:   'rgba(68, 126, 226, 0.12)',
    },
    {
      eyebrow: 'AI Transcription',
      title: 'Capture Every Insight',
      description:
        'Record lectures, interviews, and seminars. Scholaflow transcribes audio automatically and lets you generate structured AI notes from any recording.',
      bullets: [
        'Automatic audio transcription',
        'AI-generated structured notes',
        'Organize recordings into groups',
        'Synchronized transcript + audio view',
      ],
      color: '#34a853',
      bgGradient: 'linear-gradient(140deg, #e6f4ea 0%, #b8e0c2 100%)',
      accentBg:   'rgba(52, 168, 83, 0.12)',
    },
    {
      eyebrow: 'References & Papers',
      title: 'Manage Your Literature',
      description:
        'Import academic papers and references in one place. Link them to notebook posts to keep your citations organized and searchable.',
      bullets: [
        'Full reference CRUD',
        'Link papers to notebook posts',
        'Shared reference collections',
        'Searchable reference library',
      ],
      color: '#f9ab00',
      bgGradient: 'linear-gradient(140deg, #fef9e7 0%, #fce3a0 100%)',
      accentBg:   'rgba(249, 171, 0, 0.12)',
    },
  ]
</script>

<section class="detail-section">
  <div class="detail-inner">
    {#each rows as row, i}
      <div class="detail-row" class:reverse={i % 2 !== 0}>
        <div class="detail-text">
          <span class="detail-eyebrow" style="color: {row.color}">{row.eyebrow}</span>
          <h2 class="detail-title">{row.title}</h2>
          <p class="detail-desc">{row.description}</p>
          <ul class="detail-bullets">
            {#each row.bullets as b}
              <li>
                <CheckCircle2 size={16} color={row.color} />
                <span>{b}</span>
              </li>
            {/each}
          </ul>
        </div>
        <div class="detail-visual" style="background: {row.bgGradient}">
          <div class="visual-card">
            <div class="vc-header" style="background: {row.accentBg}; border-left: 3px solid {row.color}">
              <div class="vc-title-line" style="background: {row.color}40"></div>
              <div class="vc-sub-line"></div>
            </div>
            <div class="vc-body">
              <div class="vc-line full"></div>
              <div class="vc-line partial"></div>
              <div class="vc-line short"></div>
              <div class="vc-chip-row">
                <div class="vc-chip" style="background: {row.color}20; border: 1px solid {row.color}40"></div>
                <div class="vc-chip light"></div>
              </div>
            </div>
          </div>
          <span class="visual-badge" style="background: {row.color}">
            {row.eyebrow}
          </span>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .detail-section {
    padding: 80px 24px;
    background: var(--color-surface-0);
  }
  .detail-inner {
    max-width: 1100px; margin: 0 auto;
    display: flex; flex-direction: column; gap: 88px;
  }
  .detail-row {
    display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
  }
  .detail-row.reverse .detail-visual { order: -1; }
  .detail-eyebrow {
    display: block;
    font-size: 0.76rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.12em; margin-bottom: 10px;
  }
  .detail-title {
    font-size: clamp(1.6rem, 2.5vw, 2.2rem);
    font-weight: 700; line-height: 1.2; margin: 0 0 14px;
    color: var(--color-text-primary);
  }
  .detail-desc {
    font-size: 1rem; color: var(--color-text-secondary);
    line-height: 1.7; margin: 0 0 22px;
  }
  .detail-bullets {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 12px;
  }
  .detail-bullets li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 0.92rem; color: var(--color-text-secondary);
    line-height: 1.45;
  }
  .detail-bullets li :global(svg) { flex-shrink: 0; margin-top: 1px; }

  /* Visual panel */
  .detail-visual {
    border-radius: 22px; padding: 36px; min-height: 300px;
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .visual-card {
    background: var(--color-surface-0); border-radius: 14px;
    width: 100%; max-width: 340px;
    box-shadow: var(--shadow-3);
    overflow: hidden;
  }
  .vc-header {
    padding: 16px 18px;
    display: flex; flex-direction: column; gap: 8px;
    border-bottom: 1px solid var(--color-surface-2);
  }
  .vc-title-line { height: 10px; width: 55%; border-radius: 5px; }
  .vc-sub-line {
    height: 8px; width: 75%; border-radius: 4px;
    background: var(--color-surface-3);
  }
  .vc-body {
    padding: 16px 18px; display: flex; flex-direction: column; gap: 10px;
  }
  .vc-line {
    height: 9px; border-radius: 4.5px; background: var(--color-surface-3);
  }
  .vc-line.full  { width: 100%; }
  .vc-line.partial { width: 72%; }
  .vc-line.short { width: 48%; }
  .vc-chip-row { display: flex; gap: 8px; margin-top: 4px; }
  .vc-chip {
    height: 22px; width: 64px; border-radius: 100px;
  }
  .vc-chip.light {
    background: var(--color-surface-2);
    border: 1px solid var(--color-surface-3);
    width: 48px;
  }
  .visual-badge {
    position: absolute; top: 18px; right: 18px;
    padding: 4px 12px; border-radius: 100px; color: #fff;
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em;
  }

  @media (max-width: 840px) {
    .detail-row { grid-template-columns: 1fr; gap: 32px; }
    .detail-row.reverse .detail-visual { order: 0; }
    .detail-visual { min-height: 220px; padding: 24px; }
    .detail-section { padding: 64px 16px; }
    .detail-inner { gap: 60px; }
  }
</style>
