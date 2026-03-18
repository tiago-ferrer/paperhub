import { api } from './client'

export interface WaitlistPayload {
  name: string
  email: string
}

export interface WaitlistResponse {
  id: string
  message: string
}

export const waitlistApi = {
  join: (payload: WaitlistPayload) =>
    api.post<WaitlistResponse>('/api/v1/waitlist', payload),
}
