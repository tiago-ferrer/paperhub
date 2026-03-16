import { api, makeApi } from './client'
import type { Reference, CreateReferencePayload, PatchReferencePayload, PageResult } from '$lib/types/reference'
import type { Viewer } from '$lib/types/viewer'

const BASE = '/api/v1/references'

export function makeReferencesApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    list: (page = 0, size = 20, nextToken?: string) => {
      const params = new URLSearchParams({ page: String(page), size: String(size) })
      if (nextToken) params.set('next_token', nextToken)
      return a.get<PageResult<Reference>>(`${BASE}?${params}`)
    },
    get:         (id: string)                                   => a.get<Reference>(`${BASE}/${id}`),
    create:      (payload: CreateReferencePayload)              => a.post<Reference>(BASE, payload),
    replace:     (id: string, payload: CreateReferencePayload)  => a.put<Reference>(`${BASE}/${id}`, payload),
    patch:       (id: string, payload: PatchReferencePayload)   => a.patch<Reference>(`${BASE}/${id}`, payload),
    remove:      (id: string)                                   => a.delete<void>(`${BASE}/${id}`),

    addNote:     (id: string, note: string)                     => a.post<Reference>(`${BASE}/${id}/notes`, { note }),
    deleteNote:  (id: string, noteId: string)                   => a.delete<Reference>(`${BASE}/${id}/notes/${noteId}`),

    upload: (id: string, file: File) => {
      const fd = new FormData(); fd.append('file', file)
      return a.upload<Reference>(`${BASE}/${id}/attachments`, fd)
    },
    getDownloadUrl: async (id: string, attachId: string): Promise<string> => {
      const res = await a.get<{ url: string }>(`${BASE}/${id}/attachments/${attachId}/url`)
      return res.url
    },
    deleteAttachment: (id: string, attachId: string) => a.delete<Reference>(`${BASE}/${id}/attachments/${attachId}`),

    listViewers:  (id: string)                          => a.get<Viewer[]>(`${BASE}/${id}/viewers`),
    addViewer:    (id: string, viewer_username: string) => a.post<void>(`${BASE}/${id}/viewers`, { viewer_username }),
    removeViewer: (id: string, username: string)        => a.delete<void>(`${BASE}/${id}/viewers/${username}`),
  }
}

export const referencesApi = makeReferencesApi()
