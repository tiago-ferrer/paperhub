import type { PageLoad } from './$types'
import { makeKanbanApi } from '$lib/api/kanban'

export const load: PageLoad = async ({ params, url, fetch }) => {
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    cards: await makeKanbanApi(fetch).listCards(params.boardId, 0, 100, includeDeleted),
    includeDeleted,
  }
}
