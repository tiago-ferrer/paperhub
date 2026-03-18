import { api, makeApi } from './client'
import type {
  Notebook,
  NotebookPost,
  PostAttachment,
  CreateNotebookPayload,
  PatchNotebookPayload,
  CreatePostPayload,
  PatchPostPayload,
  PageResult,
} from '$lib/types/notebook'

const BASE = '/api/v1/notebooks'

export function makeNotebooksApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api

  return {
    // Notebooks
    list: (page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<Notebook>>(`${BASE}?${params}`)
    },
    get:    (id: string)                             => a.get<Notebook>(`${BASE}/${id}`),
    create: (payload: CreateNotebookPayload)         => a.post<Notebook>(BASE, payload),
    patch:  (id: string, payload: PatchNotebookPayload) => a.patch<Notebook>(`${BASE}/${id}`, payload),
    remove:  (id: string)                             => a.delete<void>(`${BASE}/${id}`),
    restore: (id: string)                             => a.put<Notebook>(`${BASE}/${id}/restore`, {}),

    // Posts
    listPosts: (id: string, page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<NotebookPost>>(`${BASE}/${id}/posts?${params}`)
    },
    getPost:    (id: string, postId: string)                  => a.get<NotebookPost>(`${BASE}/${id}/posts/${postId}`),
    createPost: (id: string, payload: CreatePostPayload)      => a.post<NotebookPost>(`${BASE}/${id}/posts`, payload),
    patchPost:  (id: string, postId: string, payload: PatchPostPayload) => a.patch<NotebookPost>(`${BASE}/${id}/posts/${postId}`, payload),
    removePost:  (id: string, postId: string)                  => a.delete<void>(`${BASE}/${id}/posts/${postId}`),
    restorePost: (id: string, postId: string)                  => a.put<NotebookPost>(`${BASE}/${id}/posts/${postId}/restore`, {}),

    // Post attachments
    uploadPostAttachment: (id: string, postId: string, file: File) => {
      const fd = new FormData(); fd.append('file', file)
      return a.upload<NotebookPost>(`${BASE}/${id}/posts/${postId}/attachments`, fd)
    },
    getPostAttachmentUrl: async (id: string, postId: string, attachId: string): Promise<string> => {
      const res = await a.get<{ url: string }>(`${BASE}/${id}/posts/${postId}/attachments/${attachId}/url`)
      return res.url
    },
    deletePostAttachment: (id: string, postId: string, attachId: string) =>
      a.delete<void>(`${BASE}/${id}/posts/${postId}/attachments/${attachId}`),
  }
}

export const notebooksApi = makeNotebooksApi()
