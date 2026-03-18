import type { PageLoad } from './$types'
import { makeGanttApi } from '$lib/api/gantt'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ fetch, params }) => {
  const g = makeGanttApi(fetch)
  try {
    const [chart, tasksResult] = await Promise.all([
      g.getChart(params.chartId),
      g.listTasks(params.chartId, 0, 100),
    ])
    return { chart, tasks: tasksResult.items }
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status
    if (status === 404) throw error(404, 'Chart not found')
    throw e
  }
}
