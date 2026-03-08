import type { PageLoad } from './$types'
import { apiKeysApi } from '$lib/api/apikeys'

export const load: PageLoad = async () => {
  return { apiKeys: await apiKeysApi.list() }
}
