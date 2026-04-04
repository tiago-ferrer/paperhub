# Auth Routes

Unauthenticated pages for login, registration, and password recovery. These share a minimal layout (no sidebar, no topbar).

## Pages

| Route | Purpose |
|---|---|
| `/login` | Email + password login form; calls `authApi.login()`, saves token to `authStore`, redirects to `/dashboard` |
| `/register` | New account form; calls `authApi.register()` |
| `/forgot-password` | Request password reset email; calls `authApi.forgotPassword()` |
| `/reset-password` | Set new password with token from email link; calls `authApi.resetPassword()` |

## Notes

- These routes intentionally have no auth guard — accessing them while logged in just shows the form
- Successful login/register → `goto('/dashboard')`
- No `+page.ts` loaders needed — all data comes from form submissions
- Errors from `ApiError` are displayed inline in the form (field-level via `error.fields`, general via `error.message`)
