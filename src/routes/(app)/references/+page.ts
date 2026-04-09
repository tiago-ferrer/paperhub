import type { PageLoad } from './$types'
import { makeReferencesApi } from '$lib/api/references'
import { makeFoldersApi } from '$lib/api/folders'

export const load: PageLoad = async ({ url, fetch }) => {
  const page      = Number(url.searchParams.get('page') ?? 0)
  const nextToken = url.searchParams.get('next_token') ?? undefined
  const folderId  = url.searchParams.get('folderId') ?? undefined

  const [references, folderTree] = await Promise.all([
    makeReferencesApi(fetch).list(page, 20, nextToken, folderId),
    makeFoldersApi(fetch).list(),
  ])

  return { references, folderTree, folderId: folderId ?? null, page }
}
