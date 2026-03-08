import { writable } from 'svelte/store'
import { browser } from '$app/environment'

const storedCollapsed = browser ? localStorage.getItem('sidebar-collapsed') === 'true' : false
export const sidebarCollapsed = writable<boolean>(storedCollapsed)
sidebarCollapsed.subscribe(v => { if (browser) localStorage.setItem('sidebar-collapsed', String(v)) })

const storedTheme = browser ? (localStorage.getItem('theme') ?? 'light') : 'light'
export const theme = writable<'light' | 'dark'>(storedTheme as 'light' | 'dark')
theme.subscribe(v => {
  if (browser) {
    localStorage.setItem('theme', v)
    document.documentElement.setAttribute('data-theme', v)
  }
})

export function toggleTheme() { theme.update(t => t === 'light' ? 'dark' : 'light') }
export function toggleSidebar() { sidebarCollapsed.update(c => !c) }
