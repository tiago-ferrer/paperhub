import type { Reference, PatchReferencePayload } from '$lib/types/reference'

export function buildPatch(original: Reference, current: Partial<Reference>): PatchReferencePayload {
  const patch: Record<string, unknown> = {}
  for (const key of Object.keys(current) as (keyof typeof current)[]) {
    if (JSON.stringify(current[key]) !== JSON.stringify(original[key])) {
      patch[key] = current[key]
    }
  }
  return patch as PatchReferencePayload
}
