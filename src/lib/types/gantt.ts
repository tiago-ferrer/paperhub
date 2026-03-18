export interface GanttChart {
  id: string
  owner: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface GanttTask {
  id: string
  chart_id: string
  owner: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  progress: number
  color: string | null
  depends_on: string[]
  labels: string[]
  position: number
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface CreateChartPayload {
  title: string
  description?: string
}

export type PatchChartPayload = Partial<CreateChartPayload>

export interface CreateTaskPayload {
  title: string
  description?: string
  start_date: string
  end_date: string
  progress?: number
  color?: string
  depends_on?: string[]
  labels?: string[]
  position?: number
}

export type PatchTaskPayload = Partial<CreateTaskPayload>

export interface PageResult<T> {
  items: T[]
  page: number
  size: number
  next_token?: string
}
