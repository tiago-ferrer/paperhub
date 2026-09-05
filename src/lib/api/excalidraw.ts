import { api, makeApi } from './client'
import type {
  ExcalidrawDrawing,
  ExcalidrawSceneData,
  CreateExcalidrawDrawingPayload,
  PatchExcalidrawDrawingPayload,
  PageResult,
} from '$lib/types/excalidraw'

const BASE = '/api/v1/excalidraw'

export function makeExcalidrawApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api

  return {
    listDrawings: (page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<ExcalidrawDrawing>>(`${BASE}/drawings?${params}`)
    },
    getDrawing:     (id: string)                                    => a.get<ExcalidrawDrawing>(`${BASE}/drawings/${id}`),
    createDrawing:  (payload: CreateExcalidrawDrawingPayload)       => a.post<ExcalidrawDrawing>(`${BASE}/drawings`, payload),
    patchDrawing:   (id: string, payload: PatchExcalidrawDrawingPayload) => a.patch<ExcalidrawDrawing>(`${BASE}/drawings/${id}`, payload),
    removeDrawing:  (id: string)                                    => a.delete<void>(`${BASE}/drawings/${id}`),
    restoreDrawing: (id: string)                                    => a.put<ExcalidrawDrawing>(`${BASE}/drawings/${id}/restore`, {}),

    // Scene: multipart upload, download via a presigned URL fetched directly from the client
    // (the JSON itself never round-trips through this API a second time).
    saveScene: (id: string, scene: ExcalidrawSceneData) => {
      const form = new FormData()
      form.append('file', new Blob([JSON.stringify(scene)], { type: 'application/json' }), 'scene.json')
      return a.putForm<ExcalidrawDrawing>(`${BASE}/drawings/${id}/scene`, form)
    },
    getSceneUrl: (id: string) => a.get<{ url: string }>(`${BASE}/drawings/${id}/scene/url`),
  }
}

export const excalidrawApi = makeExcalidrawApi()
