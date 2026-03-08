import type { PageLoad } from './$types'
import { papersApi } from '$lib/api/papers'
import { apiKeysApi } from '$lib/api/apikeys'

export const load: PageLoad = async () => {
  const [papers, apiKeys] = await Promise.all([
    papersApi.list(0, 5),
    apiKeysApi.list(),
  ])
  return { recentPapers: papers.items, apiKeyCount: apiKeys.length }
}
