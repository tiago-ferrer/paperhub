import type { PageLoad } from './$types'
import { makeProjectsApi } from '$lib/api/projects'
import { makeNotebooksApi } from '$lib/api/notebooks'
import { makeTranscriptionApi } from '$lib/api/transcription'
import { makeReferencesApi } from '$lib/api/references'
import { makeKanbanApi } from '$lib/api/kanban'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const [project, notebooks, groups, references, boards] = await Promise.all([
      makeProjectsApi(fetch).get(params.projectId),
      makeNotebooksApi(fetch).list(0, 100, false),
      makeTranscriptionApi(fetch).listGroups(0, 100, false),
      makeReferencesApi(fetch).list(0, 100),
      makeKanbanApi(fetch).listBoards(0, 100, false),
    ])
    return {
      project,
      notebooks: notebooks.items,
      groups: groups.items,
      references: references.items,
      boards: boards.items,
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Project not found')
    throw e
  }
}
