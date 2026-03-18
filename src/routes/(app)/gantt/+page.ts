import type { PageLoad } from './$types'
import { makeGanttApi } from '$lib/api/gantt'

export const load: PageLoad = async ({ url, fetch }) => {
  const page = Number(url.searchParams.get('page') ?? 0)
  const includeDeleted = url.searchParams.get('includeDeleted') === 'true'
  return {
    charts: await makeGanttApi(fetch).listCharts(page, 20, includeDeleted),
    page,
    includeDeleted,
  }
}
