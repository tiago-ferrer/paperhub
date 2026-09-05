export interface ExcalidrawDrawing {
  id: string
  owner: string
  title: string
  description: string | null
  has_scene: boolean
  has_thumbnail: boolean
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
}

/** Shape saved/loaded as the drawing's scene JSON (uploaded via multipart, fetched via presigned URL). */
export interface ExcalidrawSceneData {
  elements: unknown[] // ExcalidrawElement[] from the library — kept unknown to avoid coupling to its types
  appState: Record<string, unknown>
  files?: Record<string, unknown> // embedded images (dataURL) — see MVP note in docs/excalidraw-drawings-plan.md
}

export interface CreateExcalidrawDrawingPayload {
  title: string
  description?: string
}

export type PatchExcalidrawDrawingPayload = Partial<CreateExcalidrawDrawingPayload>

/** Matches the backend's shared PageResult DTO (snake_case via the global Jackson naming strategy). */
export interface PageResult<T> {
  items: T[]
  page: number
  size: number
  last_evaluated_key: string | null
}
