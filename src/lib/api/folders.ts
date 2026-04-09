import { api, makeApi } from './client'
import type { ReferenceFolder, CreateFolderPayload, RenameFolderPayload, MoveFolderPayload } from '$lib/types/folder'

const BASE = '/api/v1/reference-folders'

export function makeFoldersApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    list:   ()                                  => a.get<ReferenceFolder[]>(BASE),
    create: (payload: CreateFolderPayload)      => a.post<ReferenceFolder>(BASE, payload),
    rename: (id: string, payload: RenameFolderPayload) => a.patch<ReferenceFolder>(`${BASE}/${id}`, payload),
    move:   (id: string, payload: MoveFolderPayload)   => a.put<ReferenceFolder>(`${BASE}/${id}/parent`, payload),
    remove: (id: string)                        => a.delete<void>(`${BASE}/${id}`),
  }
}

export const foldersApi = makeFoldersApi()
