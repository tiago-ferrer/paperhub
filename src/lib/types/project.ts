export type ProjectItemType =
  | 'NOTEBOOK'
  | 'TRANSCRIPTION_GROUP'
  | 'PAPER'
  | 'NOTEBOOK_POST'
  | 'TRANSCRIPTION'
  | 'KANBAN_BOARD'
  | 'GANTT_CHART'

export interface ProjectItem {
  id: string
  type: ProjectItemType
  entity_id: string
  parent_id: string | null
  added_at: string
}

export interface Project {
  id: string
  owner: string
  name: string
  description: string | null
  items: ProjectItem[]
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface CreateProjectPayload {
  name: string
  description?: string
}

export type PatchProjectPayload = Partial<CreateProjectPayload>

export interface AddProjectItemPayload {
  type: ProjectItemType
  entity_id: string
  parent_id?: string | null
}

export interface ProjectPageResult {
  items: Project[]
  page: number
  size: number
  last_evaluated_key: string | null
}
