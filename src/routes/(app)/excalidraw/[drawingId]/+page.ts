import type { PageLoad } from './$types'
import { makeExcalidrawApi } from '$lib/api/excalidraw'
import { ApiError } from '$lib/api/client'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch }) => {
  const api = makeExcalidrawApi(fetch)

  let drawing
  try {
    drawing = await api.getDrawing(params.drawingId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Drawing not found')
    throw e
  }

  // The scene JSON itself is fetched client-side from this presigned URL directly
  // against S3 — it never round-trips through our API a second time.
  const sceneUrl = drawing.has_scene ? await api.getSceneUrl(params.drawingId) : null

  return { drawing, sceneUrl: sceneUrl?.url ?? null }
}
