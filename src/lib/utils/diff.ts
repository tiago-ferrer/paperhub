import type { Paper, PatchPaperPayload } from '$lib/types/paper'

export function buildPatch(original: Paper, current: Partial<Paper>): PatchPaperPayload {
  const patch: Record<string, unknown> = {}
  for (const key of Object.keys(current) as (keyof typeof current)[]) {
    if (JSON.stringify(current[key]) !== JSON.stringify(original[key])) {
      patch[key] = current[key]
    }
  }
  return patch as PatchPaperPayload
}
