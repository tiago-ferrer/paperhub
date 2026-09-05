import type { PageLoad } from './$types'
import { makeExcalidrawApi } from '$lib/api/excalidraw'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    drawings: await makeExcalidrawApi(fetch).listDrawings(page, 20, includeDeleted),
    page,
    includeDeleted,
  }
}
