import type { PageLoad } from './$types'
import { makePapersApi } from '$lib/api/papers'
import { makeNotebooksApi } from '$lib/api/notebooks'
import type { Notebook, NotebookPost } from '$lib/types/notebook'

export interface RecentPost { post: NotebookPost; notebook: Notebook }

export const load: PageLoad = async ({ fetch }) => {
  const notebooksApi = makeNotebooksApi(fetch)

  const [papers, notebooks] = await Promise.all([
    makePapersApi(fetch).list(0, 3),
    notebooksApi.list(0, 50),
  ])

  const activeNotebooks = notebooks.items.filter(nb => !nb.deleted)
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

  return { recentPapers: papers.items, notebookCount, totalPosts, latestPosts }
}
