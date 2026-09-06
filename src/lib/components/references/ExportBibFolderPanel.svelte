<script lang="ts">
  import { referencesApi } from '$lib/api/references'
  import { ApiError } from '$lib/api/client'
  import { referencesToBibTeX, bibFilename } from '$lib/utils/bibtex-export'
  import { toast } from '$lib/stores/toast'
  import type { Reference } from '$lib/types/reference'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import Button from '$lib/components/ui/Button.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { Quote, Copy, Download, AlertTriangle } from 'lucide-svelte'

  interface Props {
    open: boolean
    /** null = "unfiled" pseudo-folder */
    folderId: string | null
    folderLabel: string
    onclose: () => void
  }
  let { open, folderId, folderLabel, onclose }: Props = $props()

  type Step = 'counting' | 'ready' | 'empty' | 'error'

  let step         = $state<Step>('counting')
  let errorMessage = $state('')
  let refs         = $state<Reference[]>([])
  let copied       = $state(false)
  let copyTimer: ReturnType<typeof setTimeout>

  const apiFolderId = $derived(folderId ?? 'unfiled')

  $effect(() => {
    if (open) load()
  })

  async function load() {
    step = 'counting'
    errorMessage = ''
    refs = []
    copied = false
    try {
      let page = 0
      const all: Reference[] = []
      // No cursor — GET /references paginates by real page*size offset, so a short
      // (< requested size) page is the signal that this was the last one.
      for (;;) {
        const result = await referencesApi.list(page, 100, apiFolderId)
        all.push(...result.items)
        if (result.items.length < 100) break
        page++
      }
      refs = all
      step = all.length === 0 ? 'empty' : 'ready'
    } catch (e) {
      errorMessage = e instanceof ApiError ? e.message : 'Não foi possível carregar esta pasta.'
      step = 'error'
    }
  }

  async function copyBib() {
    try {
      await navigator.clipboard.writeText(referencesToBibTeX(refs))
      clearTimeout(copyTimer)
      copied = true
      copyTimer = setTimeout(() => (copied = false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  function downloadBib() {
    const blob = new Blob([referencesToBibTeX(refs)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = bibFilename(folderLabel)
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
</script>

<SlideOver open={open} title="Exportar .bib" onclose={onclose} width="400px">
<div class="panel">
  <p class="folder-label">{folderLabel}</p>

  {#if step === 'counting'}
    <div class="state-row">
      <Spinner size={20} />
      <span>Buscando references da pasta…</span>
    </div>
  {:else if step === 'empty'}
    <div class="state-row empty">
      <Quote size={28} />
      <span>Nenhuma reference nesta pasta.</span>
    </div>
  {:else if step === 'error'}
    <div class="state-row error">
      <AlertTriangle size={20} />
      <span>{errorMessage}</span>
    </div>
    <Button variant="outlined" onclick={load}>Tentar novamente</Button>
  {:else}
    <p class="summary">{refs.length} {refs.length === 1 ? 'reference' : 'references'}.</p>
    <div class="actions">
      <Button variant="outlined" onclick={copyBib}>
        {#if copied}Copiado!{:else}<Copy size={18} /> Copiar para a área de transferência{/if}
      </Button>
      <Button onclick={downloadBib}>
        <Download size={18} /> Baixar .bib
      </Button>
    </div>
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

  .summary { margin: 0; font-size: 0.875rem; }

  .actions { display: flex; flex-direction: column; gap: 8px; }
</style>
