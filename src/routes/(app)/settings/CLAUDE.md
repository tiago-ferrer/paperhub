# Settings

User profile and account settings.

## Routes

```
settings/
  +page.svelte    # Settings form
```

## Content

Single-page settings form. No `+page.ts` loader — user profile data comes from `authStore` / `currentUser`.

Typical settings: display name, email, password change, theme preference (light/dark).

Theme toggle also available in `TopBar` — both sync to `$lib/stores/ui` `theme` store which persists to `localStorage`.
