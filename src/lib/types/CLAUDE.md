# Types

TypeScript interfaces and enums that mirror the backend REST API models. No business logic here — pure data shapes.

## Files

| File | Key exports |
|---|---|
| `auth.ts` | `LoginPayload`, `RegisterPayload`, `TokenResponse`, `UserProfile` |
| `reference.ts` | `Reference`, `BibTexEntryType` (14-value enum), `CreateReferencePayload`, `PatchReferencePayload` |
| `notebook.ts` | `Notebook`, `NotebookPost`, `HandwritingPost`, `PostAttachment`, `CreateNotebookPayload`, `PatchNotebookPayload`, `CreatePostPayload`, `PatchPostPayload`, `PageResult<T>` |
| `project.ts` | `Project`, `ProjectItem`, `ProjectItemType` enum (`NOTEBOOK`, `PAPER`, `KANBAN_BOARD`, `GANTT_CHART`, `TRANSCRIPTION_GROUP`) |
| `kanban.ts` | `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `CreateBoardPayload`, `PatchBoardPayload` |
| `gantt.ts` | `GanttChart`, `GanttTask`, `CreateChartPayload`, `PatchChartPayload`, `PageResult<T>` |
| `transcription.ts` | `TranscriptionGroup`, `Transcription`, `AudioAttachment`, `TranscriptStatus` (`PENDING`, `PROCESSING`, `DONE`, `FAILED`) |
| `apikey.ts` | `ApiKey`, `ApiKeyCreated`, `CreateApiKeyPayload`, `McpPrivilege` |
| `viewer.ts` | `Viewer`, `AddViewerPayload` |

## Conventions

- All IDs are `string` (UUID)
- Soft-deleted items have `deletedAt: string | null`
- `PageResult<T>` is shared across several modules — it wraps paginated list responses
- `BibTexEntryType` covers: `ARTICLE`, `BOOK`, `INPROCEEDINGS`, `MISC`, `THESIS`, etc.
- `TranscriptStatus` drives polling behavior in the transcription recording detail page
