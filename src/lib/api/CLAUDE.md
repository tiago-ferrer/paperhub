# API Layer

All HTTP communication with the backend lives here. **No component ever calls `fetch` directly.**

## Base Client (`client.ts`)

`makeApi(fetchFn?)` returns an object with typed HTTP verbs:

```typescript
const a = makeApi(fetchFn) // or import { api } for the singleton
a.get<T>(path)
a.post<T>(path, body)
a.put<T>(path, body)
a.patch<T>(path, body)
a.delete<T>(path)
a.upload<T>(path, formData)   // multipart/form-data
```

- Automatically attaches `Authorization: Bearer <token>` from `authStore`
- On 401: clears auth store and redirects to `/login`
- On error: throws `ApiError(status, code, message, fields?)` — `fields` contains per-field validation errors
- 204/202 responses return `undefined`
- `VITE_API_BASE_URL` is prepended to all paths (empty string = same origin)

## Module Pattern

Every domain module exports:
1. A factory `make*Api(fetchFn?)` — used in `+page.ts` loaders (SSR-safe, receives SvelteKit's `fetch`)
2. A singleton `*Api = make*Api()` — used in components for client-side mutations

```typescript
export function makeNotebooksApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return { list(...), get(...), create(...), patch(...), remove(...) }
}
export const notebooksApi = makeNotebooksApi()
```

## Modules

| File | Backend prefix | Responsibility |
|---|---|---|
| `auth.ts` | `/api/v1/auth` | login, register, forgot/reset password, `me()` |
| `references.ts` | `/api/v1/references` | Papers CRUD, notes, attachments, viewers, download URL |
| `notebooks.ts` | `/api/v1/notebooks` | Notebooks + posts + handwriting posts + attachments |
| `projects.ts` | `/api/v1/projects` | Projects CRUD, add/remove items |
| `kanban.ts` | `/api/v1/kanban` | Boards, columns, cards CRUD + reorder |
| `gantt.ts` | `/api/v1/gantt` | Charts, tasks CRUD |
| `transcription.ts` | `/api/v1/transcription` | Groups, recordings, upload, notes, AI generate |
| `apikeys.ts` | `/api/v1/mcp/keys` | API key CRUD |
| `waitlist.ts` | `/api/v1/waitlist` | Landing page waitlist join |
| `client.ts` | — | `makeApi`, `ApiError`, `api` singleton |

## Pagination

List endpoints return `PageResult<T>` (from `$lib/types/*`):
```typescript
{ items: T[], total: number, page: number, size: number }
```
Pass `page` and `size` as query params. Many also accept `includeDeleted: boolean`.

## Error Handling in Components

```typescript
try {
  await notebooksApi.create(payload)
  toast.success('Created')
} catch (e) {
  if (e instanceof ApiError) toast.error(e.message)
}
```
