# MCP (Model Context Protocol)

API key management and usage stats for MCP integrations.

## Routes

```
mcp/
  +page.svelte        # MCP home / overview
  usage/
    +page.svelte      # Usage stats (requests, tokens, quotas)
  keys/
    +page.svelte      # API key list + create + delete
    +page.ts          # Loads API keys
```

## Data Model (`$lib/types/apikey.ts`)

**ApiKey:** `id`, `name`, `prefix` (first few chars of key for display), `privileges: McpPrivilege[]`, `createdAt`, `lastUsedAt?`

**ApiKeyCreated:** extends `ApiKey` with `key: string` (shown only once at creation)

**McpPrivilege:** enum of allowed scopes (e.g. `READ_REFERENCES`, `WRITE_NOTEBOOKS`, etc.)

## API (`$lib/api/apikeys.ts`)

- `list()` → `ApiKey[]`
- `create(payload: CreateApiKeyPayload)` → `ApiKeyCreated` — the `key` field is only returned here; show it to the user immediately and warn it won't be shown again
- `delete(id)` → void

## Keys Page Behavior

- After creating a key, display the full key value in a copy-to-clipboard UI with a warning that it is shown only once
- Deletion uses `DestructiveConfirmDialog` with the key name as the confirm phrase
