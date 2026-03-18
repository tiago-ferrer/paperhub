export type TranscriptStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface AudioAttachment {
  id: string
  filename: string
  s3_key: string
  content_type: string
  size_bytes: number
  created_at: string
}

export interface TranscriptionGroup {
  id: string
  name: string
  description: string
  note_prompt: string
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface Transcription {
  id: string
  group_id: string
  name: string
  date: string
  audio_language: string | null
  transcript_text: string | null
  transcript_status: TranscriptStatus
  audio_attachment: AudioAttachment | null
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
  ttl_expiry: number | null
}

export interface TranscriptionNote {
  id: string
  transcription_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface CreateGroupPayload {
  name: string
  description?: string
  note_prompt?: string
}

export type PatchGroupPayload = Partial<CreateGroupPayload>

export interface CreateNotePayload {
  title: string
  content: string
}

export type PatchNotePayload = Partial<CreateNotePayload>

export interface PageResult<T> {
  items: T[]
  page: number
  size: number
  next_token?: string
}
