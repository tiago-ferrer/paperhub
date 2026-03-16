<script lang="ts">
  import { goto } from '$app/navigation'
  import { scale, fade } from 'svelte/transition'
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { parseBibTeX, bibTeXToPayload } from '$lib/utils/bibtex'
  import type { CreateReferencePayload } from '$lib/types/reference'
  import Button from '$lib/components/ui/Button.svelte'
  import { X, AlertCircle } from 'lucide-svelte'

  interface Props {
    open?: boolean
    onclose?: () => void
  }
  let { open = false, onclose }: Props = $props()

  let raw     = $state('')
  let saving  = $state(false)

  // Auto-parse on every change
  const parsed = $derived.by(() => {
    if (!raw.trim()) return null
    return parseBibTeX(raw)
  })

  const payload = $derived.by((): CreateReferencePayload | null => {
    if (!parsed) return null
    return bibTeXToPayload(parsed)
  })

  const parseError = $derived.by((): string | null => {
    if (!raw.trim()) return null
    if (!parsed) return 'Could not parse BibTeX — check the format and try again.'
    if (!payload?.title) return 'Parsed entry has no title field.'
    return null
  })

  const isValid = $derived(!!payload?.title && !parseError)

  function reset() {
    raw = ''
  }

  function handleClose() {
    reset()
    onclose?.()
  }

  async function create() {
    if (!payload) return
    saving = true
    try {
      const reference = await referencesApi.create(payload)
      toast.success('Reference created')
      handleClose()
      goto(`/references/${reference.id}`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create reference')
    } finally {
      saving = false
    }
  }

  // Labelled preview rows
  const preview = $derived.by(() => {
    if (!payload) return []
    const rows: { label: string; value: string }[] = []
    if (payload.entry_type)       rows.push({ label: 'Type',        value: payload.entry_type })
    if (parsed?.citation_key)     rows.push({ label: 'Key',         value: parsed.citation_key })
    if (payload.title)            rows.push({ label: 'Title',       value: payload.title })
    if (payload.author?.length)   rows.push({ label: 'Author(s)',   value: payload.author.join('; ') })
    if (payload.editor?.length)   rows.push({ label: 'Editor(s)',   value: payload.editor.join('; ') })
    if (payload.year)             rows.push({ label: 'Year',        value: String(payload.year) })
    if (payload.month)            rows.push({ label: 'Month',       value: payload.month })
    if (payload.journal)          rows.push({ label: 'Journal',     value: payload.journal })
    if (payload.booktitle)        rows.push({ label: 'Booktitle',   value: payload.booktitle })
    if (payload.volume)           rows.push({ label: 'Volume',      value: payload.volume })
    if (payload.number)           rows.push({ label: 'Number',      value: payload.number })
    if (payload.pages)            rows.push({ label: 'Pages',       value: payload.pages })
    if (payload.series)           rows.push({ label: 'Series',      value: payload.series })
    if (payload.publisher)        rows.push({ label: 'Publisher',   value: payload.publisher })
    if (payload.address)          rows.push({ label: 'Address',     value: payload.address })
    if (payload.edition)          rows.push({ label: 'Edition',     value: payload.edition })
    if (payload.doi)              rows.push({ label: 'DOI',         value: payload.doi })
    if (payload.url)              rows.push({ label: 'URL',         value: payload.url })
    if (payload.note)             rows.push({ label: 'Note',        value: payload.note })
    if (payload.abstract)         rows.push({ label: 'Abstract',    value: payload.abstract.slice(0, 160) + (payload.abstract.length > 160 ? '…' : '') })
    return rows
  })
</script>

{#if open}
  <div class="overlay" transition:fade={{ duration: 150 }} role="presentation">
    <div
      class="modal"
      transition:scale={{ start: 0.96, duration: 150 }}
      role="dialog"
      aria-modal="true"
      aria-label="Import from BibTeX"
    >
      <div class="modal-header">
        <h3>Import from BibTeX</h3>
        <button class="close-btn" onclick={handleClose} aria-label="Close"><X size={22} /></button>
      </div>

      <div class="modal-body">
        <div class="panes">
          <!-- Input pane -->
          <div class="pane input-pane">
            <label class="pane-label" for="bibtex-input">Paste BibTeX entry</label>
            <textarea
              id="bibtex-input"
              bind:value={raw}
              placeholder={"@article{einstein1905,\n  author  = {Albert Einstein},\n  title   = {On the Electrodynamics of Moving Bodies},\n  journal = {Annalen der Physik},\n  year    = {1905},\n  volume  = {17},\n  pages   = {891--921}\n}"}
              spellcheck="false"
              autocomplete="off"
            ></textarea>
          </div>

          <!-- Preview pane -->
          <div class="pane preview-pane">
            <span class="pane-label">Parsed preview</span>
            {#if !raw.trim()}
              <p class="hint">Paste a BibTeX entry on the left to see a preview.</p>
            {:else if parseError}
              <div class="parse-error">
                <AlertCircle size={18} />
                <span>{parseError}</span>
              </div>
            {:else}
              <dl class="preview-grid">
                {#each preview as row}
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                {/each}
              </dl>
            {/if}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <Button variant="text" onclick={handleClose}>Cancel</Button>
        <Button loading={saving} disabled={!isValid} onclick={create}>
          Create Reference
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }

  .modal {
    background: var(--color-surface-0); border-radius: 12px;
    box-shadow: var(--shadow-3); display: flex; flex-direction: column;
    width: min(900px, 100%); max-height: 88vh;
  }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid var(--color-surface-3); flex-shrink: 0;
  }
  .modal-header h3 { margin: 0; font-size: 1.0625rem; font-weight: 500; }
  .close-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
  }
  .close-btn:hover { background: var(--color-surface-2); }

  .modal-body { flex: 1; overflow: hidden; padding: 20px 24px; }

  .panes {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px; height: 100%;
    min-height: 380px;
  }

  .pane { display: flex; flex-direction: column; gap: 8px; }
  .pane-label {
    font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--color-text-secondary);
  }

  .input-pane textarea {
    flex: 1; width: 100%; resize: none; font-family: monospace; font-size: 0.8125rem;
    padding: 12px; border-radius: 8px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-1); color: var(--color-text-primary);
    outline: none; line-height: 1.6; min-height: 360px;
  }
  .input-pane textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .preview-pane {
    overflow-y: auto; border: 1px solid var(--color-surface-3); border-radius: 8px;
    padding: 12px; background: var(--color-surface-1);
  }

  .hint { font-size: 0.875rem; color: var(--color-text-disabled); margin: 0; }

  .parse-error {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 0.875rem; color: var(--color-error); padding: 8px 0;
  }

  .preview-grid {
    display: grid; grid-template-columns: 80px 1fr; gap: 4px 12px;
    font-size: 0.8125rem; margin: 0;
  }
  dt { color: var(--color-text-secondary); font-weight: 500; word-break: keep-all; padding: 3px 0; }
  dd { margin: 0; color: var(--color-text-primary); word-break: break-word; padding: 3px 0; }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 14px 24px; border-top: 1px solid var(--color-surface-3); flex-shrink: 0;
  }

  @media (max-width: 680px) {
    .panes { grid-template-columns: 1fr; }
    .overlay { padding: 12px; }
  }
</style>
