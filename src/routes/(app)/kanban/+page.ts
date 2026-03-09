import type { PageLoad } from './$types'
import { makeKanbanApi } from '$lib/api/kanban'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    boards: await makeKanbanApi(fetch).listBoards(page, 20, includeDeleted),
    page,
    includeDeleted,
  }
}
