import type { PageLoad } from './$types'
import { makeNotebooksApi } from '$lib/api/notebooks'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: PageLoad = async ({ params, url, fetch }) => {
  const postsPage = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  const api = makeNotebooksApi(fetch)
  try {
    const [notebook, posts] = await Promise.all([
      api.get(params.id),
      api.listPosts(params.id, postsPage, 20, includeDeleted),
    ])
    return { notebook, posts, postsPage, includeDeleted }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Notebook not found')
    throw e
  }
}
