import type { PageLoad } from './$types'
import { makeGanttApi } from '$lib/api/gantt'
import { error } from '@sveltejs/kit'
import { settle } from '$lib/utils/settle'

export const load: PageLoad = async ({ fetch, params }) => {
  const g = makeGanttApi(fetch)

  // Critical: the chart record (title/description) defines the page shell.
  let chart
  try {
    chart = await g.getChart(params.chartId)
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status
    if (status === 404) throw error(404, 'Chart not found')
    throw e
  }

  // Degradable: the timeline can fail independently of the chart record itself
  // (see $lib/utils/settle.ts) — the page still shows the chart header with a
  // SectionError in place of the grid instead of blanking entirely.
  const tasksResult = await settle(g.listTasks(params.chartId, 0, 100))

  return { chart, tasks: tasksResult.data?.items ?? [], tasksError: tasksResult.error }
}
