import { writable } from 'svelte/store'
import type { Notebook } from '$lib/types/notebook'
import { notebooksApi } from '$lib/api/notebooks'

export const notebooks = writable<Notebook[]>([])

export async function refreshNotebooks(): Promise<void> {
  try {
    const result = await notebooksApi.list(0, 100, false)
    notebooks.set(result.items)
  } catch {
    // Silent — sidebar shows empty state if API unavailable
  }
}
