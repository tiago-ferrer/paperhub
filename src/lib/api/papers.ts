import { api } from './client'
import type { Paper, CreatePaperPayload, PatchPaperPayload, PageResult } from '$lib/types/paper'
import type { Viewer } from '$lib/types/viewer'

const BASE = '/api/v1/papers'

export const papersApi = {
  list: (page = 0, size = 20, nextToken?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (nextToken) params.set('next_token', nextToken)
    return api.get<PageResult<Paper>>(`${BASE}?${params}`)
  },
  get:         (id: string)                              => api.get<Paper>(`${BASE}/${id}`),
  create:      (payload: CreatePaperPayload)             => api.post<Paper>(BASE, payload),
  replace:     (id: string, payload: CreatePaperPayload) => api.put<Paper>(`${BASE}/${id}`, payload),
  patch:       (id: string, payload: PatchPaperPayload)  => api.patch<Paper>(`${BASE}/${id}`, payload),
  remove:      (id: string)                              => api.delete<void>(`${BASE}/${id}`),

  addNote:     (id: string, note: string)                => api.post<Paper>(`${BASE}/${id}/notes`, { note }),
  deleteNote:  (id: string, noteId: string)              => api.delete<Paper>(`${BASE}/${id}/notes/${noteId}`),

  upload: (id: string, file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.upload<Paper>(`${BASE}/${id}/attachments`, fd)
  },
  getDownloadUrl:   (id: string, attachId: string) => api.get<string>(`${BASE}/${id}/attachments/${attachId}/url`),
  deleteAttachment: (id: string, attachId: string) => api.delete<Paper>(`${BASE}/${id}/attachments/${attachId}`),

  listViewers:  (id: string)                          => api.get<Viewer[]>(`${BASE}/${id}/viewers`),
  addViewer:    (id: string, viewer_username: string) => api.post<void>(`${BASE}/${id}/viewers`, { viewer_username }),
  removeViewer: (id: string, username: string)        => api.delete<void>(`${BASE}/${id}/viewers/${username}`),
}
