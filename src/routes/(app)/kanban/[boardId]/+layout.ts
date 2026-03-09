import type { LayoutLoad } from './$types'
import { makeKanbanApi } from '$lib/api/kanban'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: LayoutLoad = async ({ params, fetch }) => {
  try {
    return { board: await makeKanbanApi(fetch).getBoard(params.boardId) }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Board not found')
    throw e
  }
}
