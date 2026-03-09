import type { PageLoad } from './$types'
import { makeNotebooksApi } from '$lib/api/notebooks'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    return { post: await makeNotebooksApi(fetch).getPost(params.id, params.postId) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Post not found')
    throw e
  }
}
