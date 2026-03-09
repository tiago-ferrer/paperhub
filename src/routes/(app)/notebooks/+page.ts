import type { PageLoad } from './$types'
import { makeNotebooksApi } from '$lib/api/notebooks'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    notebooks: await makeNotebooksApi(fetch).list(page, 20, includeDeleted),
    page,
    includeDeleted,
  }
}
