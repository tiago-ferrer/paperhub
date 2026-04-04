# Dashboard

Stats overview and quick-action entry point for the app.

## Routes

```
dashboard/
  +page.svelte    # Stats cards + quick action buttons
  +page.ts        # Loads summary data
```

## Data Loading (`+page.ts`)

Loads in parallel:
- Recent references (limit 3) — for "Recent Papers" card
- Active notebooks (page 0, size 50) — for notebook count
- Total post count (derived from notebook posts)

## Page Content (`+page.svelte`)

Stat cards:
- Recent papers (links to `/references`)
- Total notebooks
- Total posts
- Owner references count

Quick action buttons:
- New reference
- New notebook
- New recording

No significant local state — purely a display page driven by loader data.
