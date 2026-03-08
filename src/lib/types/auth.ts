export interface LoginPayload    { username: string; password: string }
export interface RegisterPayload { username: string; password: string; email: string }
export interface TokenResponse   { token: string; token_type: string; expires_in: number }
