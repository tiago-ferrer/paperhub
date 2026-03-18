export interface KanbanColumn {
  id: string
  name: string
  position: number
  color: string
}

export interface KanbanBoard {
  id: string
  owner: string
  title: string
  description: string
  columns: KanbanColumn[]
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface KanbanCard {
  id: string
  board_id: string
  owner: string
  column_id: string
  title: string
  description: string
  position: number
  labels: string[]
  due_date: string | null
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface KanbanColumnPayload {
  id?: string
  name: string
  position: number
  color: string
}

export interface CreateBoardPayload {
  title: string
  description?: string
  columns?: KanbanColumnPayload[]
}

export interface PatchBoardPayload {
  title?: string
  description?: string
  columns?: KanbanColumnPayload[]
}

export interface CreateCardPayload {
  column_id: string
  title: string
  description?: string
  position: number
  labels?: string[]
  due_date?: string
}

export interface PatchCardPayload {
  column_id?: string
  title?: string
  description?: string
  position?: number
  labels?: string[]
  due_date?: string | null
}

export interface PageResult<T> {
  items: T[]
  page: number
  size: number
  next_token?: string
}
