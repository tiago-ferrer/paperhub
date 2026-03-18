import { api, makeApi } from './client'
import type {
  Project,
  ProjectItem,
  CreateProjectPayload,
  PatchProjectPayload,
  AddProjectItemPayload,
  ProjectPageResult,
} from '$lib/types/project'

const BASE = '/api/v1/projects'

export function makeProjectsApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api

  return {
    list: (page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<ProjectPageResult>(`${BASE}?${params}`)
    },
    get:    (id: string)                               => a.get<Project>(`${BASE}/${id}`),
    create: (payload: CreateProjectPayload)            => a.post<Project>(BASE, payload),
    patch:  (id: string, payload: PatchProjectPayload) => a.patch<Project>(`${BASE}/${id}`, payload),
    remove:  (id: string)                               => a.delete<void>(`${BASE}/${id}`),
    restore: (id: string)                               => a.put<Project>(`${BASE}/${id}/restore`, {}),

    addItem:    (id: string, payload: AddProjectItemPayload) => a.post<ProjectItem>(`${BASE}/${id}/items`, payload),
    removeItem: (id: string, itemId: string)                 => a.delete<void>(`${BASE}/${id}/items/${itemId}`),
  }
}

export const projectsApi = makeProjectsApi()
