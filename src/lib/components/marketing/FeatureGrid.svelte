<script lang="ts">
  import { NotebookPen, FileText, LayoutDashboard, Mic } from 'lucide-svelte'

  const features = [
    {
      icon: NotebookPen,
      name: 'Notebooks',
      description: 'Write and organize research notes with full Markdown + LaTeX math support, file attachments, and rich formatting.',
      color: '#447EE2',
    },
    {
      icon: FileText,
      name: 'References',
      description: 'Import and manage academic references. Link papers directly to notebook posts for seamless literature tracking.',
      color: '#34a853',
    },
    {
      icon: LayoutDashboard,
      name: 'Kanban Boards',
      description: 'Visualize your research pipeline with drag-and-drop boards. Organize tasks, projects, and progress at a glance.',
      color: '#f9ab00',
    },
    {
      icon: Mic,
      name: 'AI Transcription',
      description: 'Transcribe audio recordings automatically. Generate AI-powered structured notes from lectures and interviews.',
      color: '#ea4335',
    },
  ]
</script>

<section class="features">
  <div class="features-inner">
    <span class="section-label">Features</span>
    <h2 class="section-title">Everything you need for your research workflow</h2>
    <p class="section-sub">Four integrated tools, one unified workspace.</p>
    <div class="feature-grid">
      {#each features as f, i}
        <div class="feature-card" style="--card-color: {f.color}; animation-delay: {i * 90}ms">
          <div class="feature-icon-wrap">
            <f.icon size={26} />
          </div>
          <h3 class="feature-name">{f.name}</h3>
          <p class="feature-desc">{f.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .features {
    padding: 100px 24px;
    background: var(--color-surface-1);
    border-top: 1px solid var(--color-surface-3);
  }
  .features-inner {
    max-width: 1200px; margin: 0 auto; text-align: center;
  }
  .section-label {
    display: inline-block; text-transform: uppercase;
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em;
    color: var(--color-primary); margin-bottom: 12px;
  }
  .section-title {
    font-size: clamp(1.8rem, 3vw, 2.6rem);
    font-weight: 700; margin: 0 0 12px;
    color: var(--color-text-primary); line-height: 1.2;
  }
  .section-sub {
    font-size: 1.05rem; color: var(--color-text-secondary);
    margin: 0 0 56px;
  }
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .feature-card {
    background: var(--color-surface-0);
    border: 1px solid var(--color-surface-3);
    border-radius: 16px; padding: 28px 22px;
    text-align: left;
    transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
    animation: fadeUp 0.55s ease both;
    cursor: default;
  }
  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-3);
    border-color: color-mix(in srgb, var(--card-color) 35%, var(--color-surface-3));
  }
  .feature-icon-wrap {
    width: 52px; height: 52px; border-radius: 14px;
    background: color-mix(in srgb, var(--card-color) 15%, transparent);
    color: var(--card-color);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
  }
  .feature-name {
    font-size: 1.05rem; font-weight: 700; margin: 0 0 10px;
    color: var(--color-text-primary);
  }
  .feature-desc {
    font-size: 0.9rem; color: var(--color-text-secondary);
    line-height: 1.6; margin: 0;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 960px) {
    .feature-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 540px) {
    .feature-grid { grid-template-columns: 1fr; }
    .features { padding: 72px 16px; }
  }
</style>
