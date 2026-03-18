export type BibTexEntryType =
  | 'article'
  | 'book'
  | 'booklet'
  | 'conference'
  | 'inbook'
  | 'incollection'
  | 'inproceedings'
  | 'manual'
  | 'mastersthesis'
  | 'misc'
  | 'phdthesis'
  | 'proceedings'
  | 'techreport'
  | 'unpublished'

export const BIBTEX_ENTRY_TYPES: BibTexEntryType[] = [
  'article', 'book', 'booklet', 'conference', 'inbook', 'incollection',
  'inproceedings', 'manual', 'mastersthesis', 'misc', 'phdthesis',
  'proceedings', 'techreport', 'unpublished',
]

export type ReferenceRole = 'OWNER' | 'VIEWER'

export interface UserNote {
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

export interface Reference {
  id: string
  owner: string
  role: ReferenceRole

  // BibTeX core
  entry_type: BibTexEntryType
  citation_key: string | null
  title: string
  author: string[] | null
  editor: string[] | null
  year: number | null
  month: string | null

  // Journal / conference
  journal: string | null
  booktitle: string | null
  volume: string | null
  number: string | null
  pages: string | null
  series: string | null

  // Publisher
  publisher: string | null
  address: string | null
  edition: string | null

  // Identifiers
  doi: string | null
  url: string | null

  // Extra metadata
  abstract: string | null
  note: string | null
  categories: string[] | null
  citation_count: number | null

  // App fields
  created_at: string
  updated_at: string
  notes: UserNote[] | null
  attachments: Attachment[]
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface CreateReferencePayload {
  entry_type: BibTexEntryType
  title: string
  citation_key?: string | null
  author?: string[] | null
  editor?: string[] | null
  year?: number | null
  month?: string | null
  journal?: string | null
  booktitle?: string | null
  volume?: string | null
  number?: string | null
  pages?: string | null
  series?: string | null
  publisher?: string | null
  address?: string | null
  edition?: string | null
  doi?: string | null
  url?: string | null
  abstract?: string | null
  note?: string | null
  categories?: string[] | null
  citation_count?: number | null
}

export type PatchReferencePayload = Partial<CreateReferencePayload>

export interface PageResult<T> {
  items: T[]
  page: number
  size: number
  next_token?: string
}
