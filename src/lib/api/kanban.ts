import { api, makeApi } from './client'
import type {
  KanbanBoard,
  KanbanCard,
  CreateBoardPayload,
  PatchBoardPayload,
  CreateCardPayload,
  PatchCardPayload,
  PageResult,
} from '$lib/types/kanban'

const BASE = '/api/v1/kanban'

export function makeKanbanApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api

  return {
    // Boards
    listBoards: (page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<KanbanBoard>>(`${BASE}/boards?${params}`)
    },
    getBoard:    (boardId: string)                             => a.get<KanbanBoard>(`${BASE}/boards/${boardId}`),
    createBoard: (payload: CreateBoardPayload)                 => a.post<KanbanBoard>(`${BASE}/boards`, payload),
    patchBoard:  (boardId: string, payload: PatchBoardPayload) => a.patch<KanbanBoard>(`${BASE}/boards/${boardId}`, payload),
    removeBoard: (boardId: string)                             => a.delete<void>(`${BASE}/boards/${boardId}`),

    // Cards
    listCards: (boardId: string, page = 0, size = 100, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<KanbanCard>>(`${BASE}/boards/${boardId}/cards?${params}`)
    },
    getCard:    (boardId: string, cardId: string)                            => a.get<KanbanCard>(`${BASE}/boards/${boardId}/cards/${cardId}`),
    createCard: (boardId: string, payload: CreateCardPayload)                => a.post<KanbanCard>(`${BASE}/boards/${boardId}/cards`, payload),
    patchCard:  (boardId: string, cardId: string, payload: PatchCardPayload) => a.patch<KanbanCard>(`${BASE}/boards/${boardId}/cards/${cardId}`, payload),
    removeCard: (boardId: string, cardId: string)                            => a.delete<void>(`${BASE}/boards/${boardId}/cards/${cardId}`),
  }
}

export const kanbanApi = makeKanbanApi()
