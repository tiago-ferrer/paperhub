# Transcription

Audio recording groups with transcription, notes, and AI-assisted note generation.

## Routes

```
transcription/
  +page.svelte                    # Groups list
  +page.ts                        # Loads groups (refreshes transcriptionGroups store)
  new/
    +page.svelte                  # Create new group (name, description)
  [groupId]/
    +layout.ts                    # Loads group by ID
    +page.svelte                  # Group detail: recordings list
    +page.ts                      # Loads recordings in group
    edit/
      +page.svelte                # Edit group name/description
    new/
      +page.svelte                # Upload new recording (file + metadata)
    [transcriptionId]/
      +layout.ts                  # Loads transcription by ID
      +page.svelte                # Recording detail (main view)
      +page.ts                    # Loads transcription + notes
```

## Data Model (`$lib/types/transcription.ts`)

**TranscriptionGroup:** `id`, `name`, `description`

**Transcription:** `id`, `name`, `date`, `language`, `status: TranscriptStatus`, `audioAttachment?`, `transcript?`, `notes: TranscriptionNote[]`

**TranscriptStatus:** `PENDING` | `PROCESSING` | `DONE` | `FAILED`

**AudioAttachment:** `id`, `filename`, `mimeType`

## API (`$lib/api/transcription.ts`)

- `listGroups()`, `getGroup(id)`, `createGroup(payload)`, `patchGroup(id, payload)`, `deleteGroup(id)`
- `listTranscriptions(groupId)`, `getTranscription(groupId, id)`
- `uploadAudio(groupId, file, metadata)` — multipart upload; starts transcription job
- `retryTranscription(groupId, id)` — retry a FAILED transcription
- `getAudioUrl(groupId, id)` — presigned URL for audio streaming
- `createNote(groupId, id, content)`, `patchNote(groupId, id, noteId, content)`, `deleteNote(groupId, id, noteId)`
- `generateNote(groupId, id)` — AI generates a note from the transcript

## Recording Detail Page

Split layout:
- **Left:** audio player (streaming via presigned URL) + transcript display
- **Right:** notes list + create/edit notes with Markdown editor

**Status polling:** when `status === 'PROCESSING'`, the page polls every 5 seconds until status changes to `DONE` or `FAILED`.

**Inline editing:** recording name and date can be edited inline without navigating to an edit page.

## Sidebar Integration

The sidebar shows transcription groups as dynamic sub-items. The `transcriptionGroups` store (`$lib/stores/transcriptionGroups.ts`) is populated on sidebar mount by calling `refreshTranscriptionGroups()`.
