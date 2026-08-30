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

### `settle.ts`
- `settle<T>(promise: Promise<T>): Promise<Settled<T>>` — wraps a promise so it resolves to `{ data: T, error: null }` or `{ data: null, error: Error }` instead of rejecting
- Used in `+page.ts`/`+layout.ts` loaders to keep one independent data source from taking down an entire page — see "Falha parcial em loaders" in `src/routes/(app)/CLAUDE.md`
- Pairs with `$lib/components/data/SectionError.svelte` for the UI side
