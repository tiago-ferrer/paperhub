import { authStore } from '$lib/stores/auth'
import { get } from 'svelte/store'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) { super(message) }
}

export function makeApi(fetchFn: typeof fetch = globalThis.fetch) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const auth = get(authStore)

    const headers = new Headers(init.headers as HeadersInit)
    if (!(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (auth.token) {
      headers.set('Authorization', `Bearer ${auth.token}`)
    }

    const url = `${BASE_URL}${path}`
    console.log('[api]', init.method ?? 'GET', url, {
      hasAuth: headers.has('Authorization'),
      contentType: headers.get('Content-Type'),
      bodyType: init.body?.constructor?.name,
    })
    const res = await fetchFn(url, { ...init, headers })

    if (res.status === 401) {
      authStore.clear()
      throw new ApiError(401, 'UNAUTHORIZED', 'Session expired')
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[api] error response', res.status, text)
      let body: Record<string, unknown> = {}
      try { body = JSON.parse(text) } catch { /* not json */ }
      throw new ApiError(res.status, String(body.error ?? 'UNKNOWN'), String(body.message ?? (text || 'Request failed')))
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  return {
    get:    <T>(path: string)                     => request<T>(path),
    post:   <T>(path: string, body: unknown)      => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
    put:    <T>(path: string, body: unknown)      => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
    patch:  <T>(path: string, body: unknown)      => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: <T>(path: string)                     => request<T>(path, { method: 'DELETE' }),
    upload: <T>(path: string, formData: FormData) => request<T>(path, { method: 'POST',   body: formData }),
  }
}

export const api = makeApi()
