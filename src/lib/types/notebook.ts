export interface PostAttachment {
  id: string
  filename: string
  s3_key: string
  content_type: string
  size_bytes: number
  created_at: string
  deleted: boolean
}

export interface NotebookPost {
  id: string
  notebook_id: string
  owner: string
  title: string
  content: string
  paper_ids: string[]
  attachments: PostAttachment[]
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface Notebook {
  id: string
  owner: string
  title: string
  description: string
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface CreateNotebookPayload {
  title: string
  description?: string
}

export type PatchNotebookPayload = Partial<CreateNotebookPayload>

export interface CreatePostPayload {
  title: string
  content: string
  paperIds?: string[]
}

export type PatchPostPayload = Partial<CreatePostPayload>

export interface PageResult<T> {
  items: T[]
  page: number
  size: number
  next_token?: string
}
