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
  type?: 'TEXT' | 'HANDWRITING'
  id: string
  notebook_id: string
  owner: string
  title: string
  content: string
  pdf_s3_key?: string | null
  drawing_s3_key?: string | null
  paper_ids: string[]
  attachments: PostAttachment[]
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface HandwritingPost {
  type: 'HANDWRITING'
  id: string
  notebook_id: string
  title: string
  pdf_s3_key: string | null
  drawing_s3_key: string | null
  paper_ids: string[]
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
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
