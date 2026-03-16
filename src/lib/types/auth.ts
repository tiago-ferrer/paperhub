export interface LoginPayload          { username: string; password: string }
export interface RegisterPayload       { username: string; password: string; email: string }
export interface TokenResponse         { token: string; token_type: string; expires_in: number }
export interface ForgotPasswordPayload { email: string }
export interface ResetPasswordPayload  { token: string; new_password: string }
export interface UserProfile           { username: string; email: string }
