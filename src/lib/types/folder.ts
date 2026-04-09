export interface ReferenceFolder {
  id: string
  name: string
  parent_id: string | null
  created_at: string
  children: ReferenceFolder[]
}

export interface CreateFolderPayload {
  name: string
  parent_id?: string | null
}

export interface RenameFolderPayload {
  name: string
}

export interface MoveFolderPayload {
  parent_id: string | null
}
