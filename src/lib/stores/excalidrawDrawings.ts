import { writable } from 'svelte/store'
import type { ExcalidrawDrawing } from '$lib/types/excalidraw'
import { excalidrawApi } from '$lib/api/excalidraw'

export const excalidrawDrawings = writable<ExcalidrawDrawing[]>([])

export async function refreshExcalidrawDrawings(): Promise<void> {
  try {
    const result = await excalidrawApi.listDrawings(0, 100, false)
    excalidrawDrawings.set(result.items)
  } catch {
    // Silent — sidebar shows empty state if API unavailable
  }
}
