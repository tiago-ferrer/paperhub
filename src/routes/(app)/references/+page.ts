import type { PageLoad } from './$types'
import { makeReferencesApi } from '$lib/api/references'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const nextToken = url.searchParams.get('next_token') ?? undefined
  return { references: await makeReferencesApi(fetch).list(page, 20, nextToken), page }
}
