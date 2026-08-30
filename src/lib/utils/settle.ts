/**
 * Wraps a promise so it never rejects, turning a thrown ApiError (or anything
 * else) into a plain result object instead.
 *
 * Used in `+page.ts`/`+layout.ts` loaders to stop one independent data source
 * from taking down an entire page: `Promise.all([a, b, c])` fails whole if any
 * of a/b/c rejects, and SvelteKit renders the global `+error.svelte` in place
 * of the whole page. Wrapping the "degradable" calls (anything that isn't
 * required to render the page shell — a 404 on the primary resource should
 * still throw) in `settle()` keeps `Promise.all` from short-circuiting, so the
 * page renders with whatever succeeded and the failed section can show its own
 * inline error (see `SectionError.svelte`) instead of blanking the screen.
 *
 * Example:
 *   const [project, ganttCharts] = await Promise.all([
 *     projectsApi.get(id),           // critical — 404 should still throw
 *     settle(ganttApi.listCharts()), // degradable — render project without it
 *   ])
 *   // ganttCharts: { data: GanttChart[], error: null } | { data: null, error: Error }
 */
export type Settled<T> =
  | { data: T; error: null }
  | { data: null; error: Error }

export async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { data: await promise, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
  }
}
