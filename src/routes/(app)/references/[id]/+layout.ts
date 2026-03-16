import type { LayoutLoad } from './$types'
import { makeReferencesApi } from '$lib/api/references'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: LayoutLoad = async ({ params, fetch }) => {
  try {
    return { reference: await makeReferencesApi(fetch).get(params.id) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Reference not found')
    throw e
  }
}
