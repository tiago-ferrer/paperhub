import { writable } from 'svelte/store'
import type { GanttChart } from '$lib/types/gantt'
import { ganttApi } from '$lib/api/gantt'

export const ganttCharts = writable<GanttChart[]>([])

export async function refreshGanttCharts(): Promise<void> {
  try {
    const result = await ganttApi.listCharts(0, 100, false)
    ganttCharts.set(result.items)
  } catch {
    // Silent — sidebar shows empty state if API unavailable
  }
}
