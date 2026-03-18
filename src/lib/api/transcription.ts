import { api, makeApi, ApiError } from './client'
import { authStore } from '$lib/stores/auth'
import { get } from 'svelte/store'
import type {
  TranscriptionGroup,
  Transcription,
  TranscriptionNote,
  CreateGroupPayload,
  PatchGroupPayload,
  CreateNotePayload,
  PatchNotePayload,
  PageResult,
} from '$lib/types/transcription'

const BASE = '/api/v1/transcription-groups'
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export function makeTranscriptionApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  const f = fetchFn ?? globalThis.fetch

  return {
    // Groups
    listGroups: (page = 0, size = 100, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<TranscriptionGroup>>(`${BASE}?${params}`)
    },
    getGroup:    (groupId: string)                              => a.get<TranscriptionGroup>(`${BASE}/${groupId}`),
    createGroup: (payload: CreateGroupPayload)                  => a.post<TranscriptionGroup>(BASE, payload),
    patchGroup:  (groupId: string, payload: PatchGroupPayload)  => a.patch<TranscriptionGroup>(`${BASE}/${groupId}`, payload),
    removeGroup:  (groupId: string)                              => a.delete<void>(`${BASE}/${groupId}`),
    restoreGroup: (groupId: string)                              => a.put<TranscriptionGroup>(`${BASE}/${groupId}/restore`, {}),

    // Transcriptions
    listTranscriptions: (groupId: string, page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<Transcription>>(`${BASE}/${groupId}/transcriptions?${params}`)
    },
    getTranscription:    (groupId: string, id: string)          => a.get<Transcription>(`${BASE}/${groupId}/transcriptions/${id}`),
    createTranscription: (groupId: string, formData: FormData)  => a.upload<Transcription>(`${BASE}/${groupId}/transcriptions`, formData),
    patchTranscription:  (groupId: string, id: string, updates: { name?: string; date?: string }) => {
      const q = new URLSearchParams()
      if (updates.name !== undefined) q.set('name', updates.name)
      if (updates.date !== undefined) q.set('date', updates.date)
      return a.patch<Transcription>(`${BASE}/${groupId}/transcriptions/${id}?${q}`, {})
    },
    removeTranscription:  (groupId: string, id: string)          => a.delete<void>(`${BASE}/${groupId}/transcriptions/${id}`),
    restoreTranscription: (groupId: string, id: string)          => a.put<Transcription>(`${BASE}/${groupId}/transcriptions/${id}/restore`, {}),
    triggerTranscription: async (groupId: string, id: string, language?: string): Promise<void> => {
      try {
        const params = new URLSearchParams()
        if (language) params.append('language', language)
        const url = `${BASE}/${groupId}/transcriptions/${id}/transcribe${params.toString() ? `?${params}` : ''}`
        await a.post<Record<string, unknown>>(url, {})
      } catch (e) {
        if (e instanceof SyntaxError) return // 202 with empty body
        throw e
      }
    },

    // Audio — fetches the binary with auth and returns a local blob URL for the <audio> element.
    // Accepts an optional filename hint to fix the MIME type when the server returns
    // application/octet-stream instead of a proper audio content-type.
    getAudioBlobUrl: async (groupId: string, transcriptionId: string, filename?: string): Promise<string> => {
      const MIME_BY_EXT: Record<string, string> = {
        aac:  'audio/aac',
        amr:  'audio/amr',
        flac: 'audio/flac',
        m4a:  'audio/mp4',
        mp3:  'audio/mpeg',
        mp4:  'audio/mp4',
        ogg:  'audio/ogg',
        opus: 'audio/ogg; codecs=opus',
        pcm:  'audio/pcm',
        wav:  'audio/wav',
        webm: 'audio/webm',
      }

      const auth = get(authStore)
      const headers: HeadersInit = auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
      const res = await f(`${BASE_URL}${BASE}/${groupId}/transcriptions/${transcriptionId}/audio`, { headers })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        let body: Record<string, unknown> = {}
        try { body = JSON.parse(text) } catch { /* not json */ }
        throw new ApiError(res.status, String(body.error ?? 'UNKNOWN'), String(body.message ?? 'Failed to load audio'))
      }

      let blob = await res.blob()

      // If the server didn't return a proper audio MIME type, derive it from the filename extension
      if (!blob.type.startsWith('audio/') && filename) {
        const ext = filename.split('.').pop()?.toLowerCase() ?? ''
        const mime = MIME_BY_EXT[ext]
        if (mime) blob = new Blob([blob], { type: mime })
      }

      return URL.createObjectURL(blob)
    },

    // Notes
    listNotes: (groupId: string, transcriptionId: string, page = 0, size = 50) => {
      const params = new URLSearchParams({ page: String(page), size: String(size) })
      return a.get<PageResult<TranscriptionNote>>(`${BASE}/${groupId}/transcriptions/${transcriptionId}/notes?${params}`)
    },
    createNote: (groupId: string, transcriptionId: string, payload: CreateNotePayload) =>
      a.post<TranscriptionNote>(`${BASE}/${groupId}/transcriptions/${transcriptionId}/notes`, payload),
    patchNote:  (groupId: string, transcriptionId: string, noteId: string, payload: PatchNotePayload) =>
      a.patch<TranscriptionNote>(`${BASE}/${groupId}/transcriptions/${transcriptionId}/notes/${noteId}`, payload),
    removeNote: (groupId: string, transcriptionId: string, noteId: string) =>
      a.delete<void>(`${BASE}/${groupId}/transcriptions/${transcriptionId}/notes/${noteId}`),
    restoreNote: (groupId: string, transcriptionId: string, noteId: string) =>
      a.put<TranscriptionNote>(`${BASE}/${groupId}/transcriptions/${transcriptionId}/notes/${noteId}/restore`, {}),
    generateNote: (groupId: string, transcriptionId: string) =>
      a.post<TranscriptionNote>(`${BASE}/${groupId}/transcriptions/${transcriptionId}/notes/generate`, {}),
  }
}

export const transcriptionApi = makeTranscriptionApi()
