import { api } from './client'
import type { ApiKey, ApiKeyCreated, CreateApiKeyPayload } from '$lib/types/apikey'

export const apiKeysApi = {
  list:   ()                             => api.get<ApiKey[]>('/api/v1/api-keys'),
  create: (payload: CreateApiKeyPayload) => api.post<ApiKeyCreated>('/api/v1/api-keys', payload),
  delete: (id: string)                   => api.delete<void>(`/api/v1/api-keys/${id}`),
}
