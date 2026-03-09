import type { PageLoad } from './$types'
import { makePapersApi } from '$lib/api/papers'
import { makeApiKeysApi } from '$lib/api/apikeys'
import { makeNotebooksApi } from '$lib/api/notebooks'
import type { Notebook, NotebookPost } from '$lib/types/notebook'

export interface RecentPost { post: NotebookPost; notebook: Notebook }

export const load: PageLoad = async ({ fetch }) => {
  const notebooksApi = makeNotebooksApi(fetch)

  const [papers, apiKeys, notebooks] = await Promise.all([
    makePapersApi(fetch).list(0, 3),
    makeApiKeysApi(fetch).list(),
    notebooksApi.list(0, 20),
  ])

  const activeNotebooks = notebooks.items.filter(nb => !nb.deleted).slice(0, 10)

  const postBatches = await Promise.all(
    activeNotebooks.map(nb =>
      notebooksApi.listPosts(nb.id, 0, 3)
        .then(r => r.items.filter(p => !p.deleted).map(post => ({ post, notebook: nb })))
        .catch(() => [] as RecentPost[])
    )
  )

  const latestPosts: RecentPost[] = postBatches
    .flat()
    .sort((a, b) => new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime())
    .slice(0, 3)

  return { recentPapers: papers.items, apiKeyCount: apiKeys.length, latestPosts }
}
