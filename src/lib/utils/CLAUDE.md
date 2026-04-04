# Utils

Pure utility functions with no side effects and no Svelte dependencies.

## Files

### `markdown.ts`
- `renderMarkdown(text: string): string` — converts Markdown + LaTeX to HTML; uses `marked` + `katex`
  - Inline math: `$...$`
  - Block math: `$$...$$`
- `stripMarkdown(text: string): string` — strips Markdown to plain text (for previews/truncation)
- Used by `$lib/components/ui/MarkdownContent.svelte` and post editor preview

### `format.ts`
- Date/time formatting helpers
- Number formatting (e.g. file sizes)

### `bibtex.ts`
- BibTeX string parsing → `CreateReferencePayload`
- Used by `$lib/components/references/FromBibTexModal.svelte`

### `diff.ts`
- Text diff utilities (used in post editing)

### `ttl.ts`
- TTL/cache helpers for client-side data freshness

### `validate.ts`
- Field validation helpers (email, URL, required)
- Returns error strings or null
