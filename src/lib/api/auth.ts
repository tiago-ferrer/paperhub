import { api } from './client'
import type { LoginPayload, RegisterPayload, TokenResponse } from '$lib/types/auth'

export const authApi = {
  login:    (payload: LoginPayload)    => api.post<TokenResponse>('/api/auth/token', payload),
  register: (payload: RegisterPayload) => api.post<void>('/api/auth/register', payload),
}
