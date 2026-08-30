import type { LayoutLoad } from './$types'
import { makeTranscriptionApi } from '$lib/api/transcription'
import { error } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'
import { settle } from '$lib/utils/settle'

export const load: LayoutLoad = async ({ params, fetch }) => {
  const api = makeTranscriptionApi(fetch)

  // Critical: drives the whole page (audio player, transcript, status polling).
  let transcription
  try {
    transcription = await api.getTranscription(params.groupId, params.transcriptionId)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Transcription not found')
    throw e
  }

  // Degradable: the notes side panel can fail independently of the audio
  // player/transcript above it (see $lib/utils/settle.ts).
  const notesResult = await settle(api.listNotes(params.groupId, params.transcriptionId))

  return {
    transcription,
    notes: { items: notesResult.data?.items ?? [], error: notesResult.error },
  }
}
