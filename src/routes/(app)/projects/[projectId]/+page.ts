import type { PageLoad } from './$types'
import { makeProjectsApi } from '$lib/api/projects'
import { makeNotebooksApi } from '$lib/api/notebooks'
import { makeTranscriptionApi } from '$lib/api/transcription'
import { makeReferencesApi } from '$lib/api/references'
import { makeKanbanApi } from '$lib/api/kanban'
import { makeGanttApi } from '$lib/api/gantt'
import { makeExcalidrawApi } from '$lib/api/excalidraw'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'
import { settle } from '$lib/utils/settle'

/** One of the five item-type lists below — `items` is `[]` (not missing data) when `error` is set. */
export interface Section<T> {
  items: T[]
  error: Error | null
}

function toSection<T>(s: Awaited<ReturnType<typeof settle<{ items: T[] }>>>): Section<T> {
  return { items: s.data?.items ?? [], error: s.error }
}

export const load: PageLoad = async ({ params, fetch }) => {
  // Critical: without the project itself there's no page to render.
  let project
  try {
    project = await makeProjectsApi(fetch).get(params.projectId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Project not found')
    throw e
  }

  // Degradable: these only feed the "grouped by type" section and the add-item
  // picker. A 500 on any one of them shouldn't take the whole project page down
  // (see $lib/utils/settle.ts) — each renders its own SectionError instead.
  const [notebooks, groups, references, boards, ganttCharts, drawings] = await Promise.all([
    settle(makeNotebooksApi(fetch).list(0, 100, false)),
    settle(makeTranscriptionApi(fetch).listGroups(0, 100, false)),
    settle(makeReferencesApi(fetch).list(0, 100)),
    settle(makeKanbanApi(fetch).listBoards(0, 100, false)),
    settle(makeGanttApi(fetch).listCharts(0, 100, false)),
    settle(makeExcalidrawApi(fetch).listDrawings(0, 100, false)),
  ])

  return {
    project,
    notebooks:   toSection(notebooks),
    groups:      toSection(groups),
    references:  toSection(references),
    boards:      toSection(boards),
    ganttCharts: toSection(ganttCharts),
    drawings:    toSection(drawings),
  }
}
