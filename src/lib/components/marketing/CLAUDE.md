# Marketing Components

Landing page sections. Only used in `src/routes/+page.svelte` (the public landing page).

## Components

| Component | Purpose |
|---|---|
| `LandingNav.svelte` | Top navigation bar with logo and login/signup CTA |
| `HeroSection.svelte` | Above-the-fold hero with headline, subtext, and primary CTA |
| `FeatureGrid.svelte` | Grid of feature cards (icons + descriptions) |
| `FeatureDetail.svelte` | Alternating text+image feature detail sections |
| `SocialProof.svelte` | Testimonials or social proof block |
| `CtaSection.svelte` | Bottom call-to-action section |
| `LandingFooter.svelte` | Footer with links |
| `LoginModal.svelte` | Login modal triggered from the nav CTA |
| `WaitlistForm.svelte` | Email waitlist signup form (calls `waitlistApi.join()`) |

## Notes

- These components are completely separate from the authenticated app shell
- They use the same design tokens but do not use `Sidebar`, `TopBar`, or any app layout components
- `LoginModal` and `WaitlistForm` are the only marketing components that call API modules
