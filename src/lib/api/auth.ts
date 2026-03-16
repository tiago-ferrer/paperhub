import { api } from './client'
import type { LoginPayload, RegisterPayload, TokenResponse, ForgotPasswordPayload, ResetPasswordPayload, UserProfile } from '$lib/types/auth'

export const authApi = {
  login:          (payload: LoginPayload)          => api.post<TokenResponse>('/api/auth/token', payload),
  register:       (payload: RegisterPayload)       => api.post<void>('/api/auth/register', payload),
  forgotPassword: (payload: ForgotPasswordPayload) => api.post<void>('/api/auth/forgot-password', payload),
  resetPassword:  (payload: ResetPasswordPayload)  => api.post<void>('/api/auth/reset-password', payload),
  me:             ()                               => api.get<UserProfile>('/api/auth/me'),
}
