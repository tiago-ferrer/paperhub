export type McpPrivilege = 'OWNER' | 'VIEWER'

export interface ApiKey {
  id: string
  name: string
  privilege: McpPrivilege
  created_at: string
}

export interface ApiKeyCreated extends ApiKey {
  key_value: string
}

export interface CreateApiKeyPayload {
  name: string
  privilege: McpPrivilege
}
