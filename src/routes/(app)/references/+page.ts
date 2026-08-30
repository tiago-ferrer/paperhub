import type { PageLoad } from './$types'
import { makeReferencesApi } from '$lib/api/references'

// Folder tree is NOT fetched here: FolderTree.svelte (always rendered by this page)
// lazily loads it into the `folders` store on mount, once per session, and every
// mutation (create/rename/move/delete) updates that store optimistically. Fetching
// it again on every page/folder navigation was a redundant round trip.
export const load: PageLoad = async ({ url, fetch }) => {
  const page     = Number(url.searchParams.get('page') ?? 0)
  const folderId = url.searchParams.get('folderId') ?? undefined

  const references = await makeReferencesApi(fetch).list(page, 20, folderId)

  return { references, folderId: folderId ?? null, page }
}
