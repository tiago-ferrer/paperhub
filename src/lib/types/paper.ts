export type PaperRole = 'OWNER' | 'VIEWER'

export interface Note {
  id: string
  note: string
  created_at: string
  deleted: boolean
}

export interface Attachment {
  id: string
  filename: string
  s3_key: string
  content_type: string
  size_bytes: number
  created_at: string
  deleted: boolean
}

export interface Paper {
  id: string
  role: PaperRole
  category: string
  title: string
  authors: string[]
  year: number
  journal: string
  volume: string
  issue: string | null
  pages: string
  doi: string
  citation_count: number
  url: string
  abstract: string
  categories: string[]
  created_at: string
  updated_at: string
  notes: Note[] | null
  attachments: Attachment[]
  owner: string
  deleted: boolean
}

export interface CreatePaperPayload {
  title: string
  category: string
  authors: string[]
  year: number
  journal: string
  volume: string
  issue?: string | null
  pages: string
  doi: string
  citation_count?: number
  url?: string
  abstract?: string
  categories?: string[]
}

export type PatchPaperPayload = Partial<CreatePaperPayload>

export interface PageResult<T> {
  items: T[]
  page: number
  size: number
  next_token?: string
}
