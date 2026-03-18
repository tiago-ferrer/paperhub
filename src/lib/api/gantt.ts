import { api, makeApi } from './client'
import type {
  GanttChart,
  GanttTask,
  CreateChartPayload,
  PatchChartPayload,
  CreateTaskPayload,
  PatchTaskPayload,
  PageResult,
} from '$lib/types/gantt'

const BASE = '/api/v1/gantt'

export function makeGanttApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api

  return {
    // Charts
    listCharts: (page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), include_deleted: String(includeDeleted) })
      return a.get<PageResult<GanttChart>>(`${BASE}/charts?${params}`)
    },
    getChart:    (chartId: string)                               => a.get<GanttChart>(`${BASE}/charts/${chartId}`),
    createChart: (payload: CreateChartPayload)                   => a.post<GanttChart>(`${BASE}/charts`, payload),
    patchChart:  (chartId: string, payload: PatchChartPayload)   => a.patch<GanttChart>(`${BASE}/charts/${chartId}`, payload),
    removeChart:  (chartId: string)                               => a.delete<void>(`${BASE}/charts/${chartId}`),
    restoreChart: (chartId: string)                               => a.put<GanttChart>(`${BASE}/charts/${chartId}/restore`, {}),

    // Tasks
    listTasks: (chartId: string, page = 0, size = 100, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), include_deleted: String(includeDeleted) })
      return a.get<PageResult<GanttTask>>(`${BASE}/charts/${chartId}/tasks?${params}`)
    },
    getTask:    (chartId: string, taskId: string)                              => a.get<GanttTask>(`${BASE}/charts/${chartId}/tasks/${taskId}`),
    createTask: (chartId: string, payload: CreateTaskPayload)                  => a.post<GanttTask>(`${BASE}/charts/${chartId}/tasks`, payload),
    patchTask:  (chartId: string, taskId: string, payload: PatchTaskPayload)   => a.patch<GanttTask>(`${BASE}/charts/${chartId}/tasks/${taskId}`, payload),
    removeTask:  (chartId: string, taskId: string)                              => a.delete<void>(`${BASE}/charts/${chartId}/tasks/${taskId}`),
    restoreTask: (chartId: string, taskId: string)                              => a.put<GanttTask>(`${BASE}/charts/${chartId}/tasks/${taskId}/restore`, {}),
  }
}

export const ganttApi = makeGanttApi()
