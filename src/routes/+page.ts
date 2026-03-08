import { redirect } from '@sveltejs/kit'
import { browser } from '$app/environment'
import { get } from 'svelte/store'
import { isLoggedIn } from '$lib/stores/auth'

export const load = () => {
  if (browser) {
    throw redirect(302, get(isLoggedIn) ? '/dashboard' : '/login')
  }
  // On server, default redirect to login
  throw redirect(302, '/login')
}
