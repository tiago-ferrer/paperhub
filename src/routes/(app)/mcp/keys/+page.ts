import type { PageLoad } from './$types'
import { makeApiKeysApi } from '$lib/api/apikeys'

export const load: PageLoad = async ({ fetch }) => {
  return { apiKeys: await makeApiKeysApi(fetch).list() }
}
