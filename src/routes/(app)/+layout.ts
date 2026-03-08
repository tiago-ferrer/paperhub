import { redirect } from '@sveltejs/kit'
import { browser } from '$app/environment'
import { get } from 'svelte/store'
import { isLoggedIn } from '$lib/stores/auth'

export const load = () => {
  if (browser && !get(isLoggedIn)) {
    throw redirect(302, '/login')
  }
}
