import type { PageLoad } from './$types'
import { makeReferencesApi } from '$lib/api/references'

// reference is provided by parent +layout.ts
export const load: PageLoad = async ({ params, fetch }) => {
  const viewers = await makeReferencesApi(fetch).listViewers(params.id)
  return { viewers }
}
