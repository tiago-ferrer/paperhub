import type { PageLoad } from './$types'
import { makeReferencesApi } from '$lib/api/references'
import { makeNotebooksApi } from '$lib/api/notebooks'
import type { Notebook, NotebookPost } from '$lib/types/notebook'
import type { Reference } from '$lib/types/reference'
import { settle } from '$lib/utils/settle'

export interface RecentPost { post: NotebookPost; notebook: Notebook }

export const load: PageLoad = async ({ fetch }) => {
  const notebooksApi = makeNotebooksApi(fetch)

  // Two independent stat widgets — a 500 on one shouldn't blank the other
  // (see $lib/utils/settle.ts). Per-notebook post fetches below already had
  // their own .catch(); this brings the two top-level calls up to the same bar.
  const [references, notebooksResult] = await Promise.all([
    settle(makeReferencesApi(fetch).list(0, 3)),
    settle(notebooksApi.list(0, 50)),
  ])

  const activeNotebooks = notebooksResult.data?.items.filter(nb => !nb.deleted) ?? []
  const notebookCount = activeNotebooks.length

  const postBatches = await Promise.all(
    activeNotebooks.slice(0, 10).map(nb =>
      notebooksApi.listPosts(nb.id, 0, 50)
        .then(r => ({ nb, posts: r.items.filter(p => !p.deleted) }))
        .catch(() => ({ nb, posts: [] as NotebookPost[] }))
    )
  )

  const totalPosts = postBatches.reduce((sum, { posts }) => sum + posts.length, 0)

  const latestPosts: RecentPost[] = postBatches
    .flatMap(({ nb, posts }) => posts.map(post => ({ post, notebook: nb })))
    .sort((a, b) => new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime())
    .slice(0, 3)

  return {
    recentReferences: { items: references.data?.items ?? ([] as Reference[]), error: references.error },
    notebooks: { notebookCount, totalPosts, latestPosts, error: notebooksResult.error },
  }
}
