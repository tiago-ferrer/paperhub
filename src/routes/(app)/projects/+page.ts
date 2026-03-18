import type { PageLoad } from './$types'
import { makeProjectsApi } from '$lib/api/projects'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    projects: await makeProjectsApi(fetch).list(page, 20, includeDeleted),
    page,
    includeDeleted,
  }
}
