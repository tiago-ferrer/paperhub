import type { PageLoad } from './$types'
import { papersApi } from '$lib/api/papers'

export const load: PageLoad = async ({ url }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const nextToken = url.searchParams.get('next_token') ?? undefined
  return { papers: await papersApi.list(page, 20, nextToken), page }
}
