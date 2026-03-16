import { writable, derived } from 'svelte/store'
import { browser } from '$app/environment'

interface AuthState {
  token: string | null
  username: string | null
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return {}
  }
}

function createAuthStore() {
  const initial: AuthState = browser
    ? { token: localStorage.getItem('token'), username: localStorage.getItem('username') }
    : { token: null, username: null }

  const { subscribe, set } = writable<AuthState>(initial)

  return {
    subscribe,
    login(token: string, username: string) {
      if (browser) {
        localStorage.setItem('token', token)
        localStorage.setItem('username', username)
      }
      set({ token, username })
    },
    clear() {
      if (browser) {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
      }
      set({ token: null, username: null })
    },
  }
}

export const authStore   = createAuthStore()
export const isLoggedIn  = derived(authStore, $a => !!$a.token)
export const currentUser = derived(authStore, $a => $a.username)
export const currentEmail = derived(authStore, $a => {
  if (!$a.token) return null
  const payload = decodeJwtPayload($a.token)
  return typeof payload.email === 'string' ? payload.email : null
})
