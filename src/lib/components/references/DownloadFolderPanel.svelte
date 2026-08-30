<script lang="ts">
  import { referencesApi, downloadFolderZip, type FolderDownloadMode } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { formatBytes } from '$lib/utils/format'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { FileDown, CheckCircle2, AlertTriangle } from 'lucide-svelte'

  interface Props {
    open: boolean
    /** null = "unfiled" pseudo-folder */
    folderId: string | null
    folderLabel: string
    onclose: () => void
  }
  let { open, folderId, folderLabel, onclose }: Props = $props()

  type Step = 'counting' | 'ready' | 'empty' | 'downloading' | 'saving' | 'done' | 'error'

  let mode          = $state<FolderDownloadMode>('original')
  let step          = $state<Step>('counting')
  let errorMessage  = $state('')
  let refCount      = $state(0)
  let attachCount   = $state(0)
  let fallbackCount = $state(0) // attachments with no saved annotation — would use the original when mode = annotated
  let bytesReceived = $state(0)

  let abortController: AbortController | null = null
  let objectUrl: string | null = null

  const apiFolderId = $derived(folderId ?? 'unfiled')

  // Reset and reload every time the panel is opened for a (possibly new) folder.
  $effect(() => {
    if (open) loadPreview()
    else cleanup()
  })

  function cleanup() {
    abortController?.abort()
    abortController = null
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null }
  }

  async function loadPreview() {
    step = 'counting'
    errorMessage = ''
    try {
      let page = 0
      let refs = 0, attachments = 0, fallbacks = 0
      // No cursor — GET /references paginates by real page*size offset, so a short
      // (< requested size) page is the signal that this was the last one.
      for (;;) {
        const result = await referencesApi.list(page, 100, apiFolderId)
        for (const reference of result.items) {
          refs++
          for (const attach of reference.attachments) {
            if (attach.deleted) continue
            attachments++
            if (attach.annotation_key === null) fallbacks++
          }
        }
        if (result.items.length < 100) break
        page++
      }
      refCount = refs
      attachCount = attachments
      fallbackCount = fallbacks
      step = attachments === 0 ? 'empty' : 'ready'
    } catch (e) {
      errorMessage = e instanceof ApiError ? e.message : 'Não foi possível carregar esta pasta.'
      step = 'error'
    }
  }

  async function startDownload() {
    step = 'downloading'
    errorMessage = ''
    bytesReceived = 0
    abortController = new AbortController()
    try {
      const { blob, filename } = await downloadFolderZip(apiFolderId, mode, {
        onProgress: (n) => bytesReceived = n,
        signal: abortController.signal,
      })
      step = 'saving'
      objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      step = 'done'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        step = 'ready' // user cancelled — back to the pre-download state, no error shown
        return
      }
      errorMessage = e instanceof ApiError ? e.message : 'O download falhou. Tente novamente.'
      step = 'error'
    } finally {
      abortController = null
    }
  }

  function cancelDownload() {
    abortController?.abort()
  }

  function retry() {
    if (refCount === 0 && attachCount === 0) loadPreview()
    else startDownload()
  }
</script>

<SlideOver open={open} title="Baixar pasta" onclose={onclose} width="400px">
<div class="panel">
  <p class="folder-label">{folderLabel}</p>

  {#if step === 'counting'}
    <div class="state-row">
      <Spinner size={20} />
      <span>Buscando references da pasta…</span>
    </div>
  {:else if step === 'empty'}
    <div class="state-row empty">
      <FileDown size={28} />
      <span>Nenhum anexo para baixar nesta pasta.</span>
    </div>
  {:else if step === 'error'}
    <div class="state-row error">
      <AlertTriangle size={20} />
      <span>{errorMessage}</span>
    </div>
    <Button variant="outlined" onclick={retry}>Tentar novamente</Button>
  {:else}
    <div class="summary">
      <p>{refCount} {refCount === 1 ? 'reference' : 'references'}, {attachCount} {attachCount === 1 ? 'anexo' : 'anexos'}.</p>
      {#if mode === 'annotated' && fallbackCount > 0}
        <p class="hint">{fallbackCount} {fallbackCount === 1 ? 'anexo usará' : 'anexos usarão'} a versão original — sem anotação salva.</p>
      {/if}
    </div>

    <fieldset class="mode-picker" disabled={step === 'downloading' || step === 'saving'}>
      <legend>O que baixar</legend>
      <label class="mode-option">
        <input type="radio" name="mode" value="original" bind:group={mode} />
        Arquivos originais
      </label>
      <label class="mode-option">
        <input type="radio" name="mode" value="annotated" bind:group={mode} />
        Com anotações (quando disponível)
      </label>
    </fieldset>

    {#if step === 'downloading'}
      <div class="state-row">
        <Spinner size={20} />
        <span>Gerando zip no servidor… {formatBytes(bytesReceived)} recebidos</span>
      </div>
      <Button variant="outlined" onclick={cancelDownload}>Cancelar</Button>
    {:else if step === 'saving'}
      <div class="state-row">
        <Spinner size={20} />
        <span>Salvando arquivo…</span>
      </div>
    {:else if step === 'done'}
      <div class="state-row done">
        <CheckCircle2 size={20} />
        <span>Download concluído.</span>
      </div>
      <Button variant="outlined" onclick={onclose}>Fechar</Button>
    {:else}
      <Button onclick={startDownload}>
        <FileDown size={18} /> Baixar
      </Button>
    {/if}
  {/if}
</div>
</SlideOver>

<style>
  .panel { display: flex; flex-direction: column; gap: 16px; }
  .folder-label { margin: 0; font-size: 0.875rem; color: var(--color-text-secondary); }

  .state-row {
    display: flex; align-items: center; gap: 10px;
    font-size: 0.875rem; color: var(--color-text-secondary);
    padding: 12px 0;
  }
  .state-row.empty { flex-direction: column; text-align: center; padding: 32px 0; color: var(--color-text-disabled); }
  .state-row.error { color: var(--color-error); }
  .state-row.done { color: var(--color-success, var(--color-primary)); }

  .summary { font-size: 0.875rem; }
  .summary p { margin: 0 0 4px; }
  .summary .hint { color: var(--color-text-secondary); font-size: 0.8125rem; }

  .mode-picker {
    border: 1px solid var(--color-surface-3); border-radius: 10px;
    padding: 12px 14px; display: flex; flex-direction: column; gap: 8px;
  }
  .mode-picker legend {
    font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.04em; color: var(--color-text-disabled); padding: 0 4px;
  }
  .mode-option {
    display: flex; align-items: center; gap: 8px;
    font-size: 0.875rem; color: var(--color-text-primary); cursor: pointer;
  }
  .mode-option input { accent-color: var(--color-primary); }
</style>
