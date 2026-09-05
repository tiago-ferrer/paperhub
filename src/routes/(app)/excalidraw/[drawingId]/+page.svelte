<script lang="ts">
  import type { PageData } from './$types'
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { beforeNavigate } from '$app/navigation'
  import { excalidrawApi } from '$lib/api/excalidraw'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { theme } from '$lib/stores/ui'
  import type { ExcalidrawSceneData } from '$lib/types/excalidraw'
  import ExcalidrawCanvas from '$lib/components/excalidraw/ExcalidrawCanvas.svelte'
  import Spinner from '$lib/components/ui/Spinner.svelte'
  import { Pencil, Check, X } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  let drawing = $state({ ...data.drawing })

  // ── Title editing (immediate PATCH, separate from scene autosave) ──────────────
  let editingTitle = $state(false)
  let titleInput   = $state(drawing.title)
  let savingTitle  = $state(false)

  async function saveTitle() {
    if (!titleInput.trim() || titleInput === drawing.title) { editingTitle = false; return }
    savingTitle = true
    try {
      drawing = await excalidrawApi.patchDrawing(drawing.id, { title: titleInput })
      editingTitle = false
    } catch {
      toast.error('Failed to update title')
    } finally {
      savingTitle = false
    }
  }

  // ── Scene loading ────────────────────────────────────────────────────────────
  // The scene JSON is fetched client-side, directly from the presigned S3 URL —
  // it never round-trips through our own API a second time.
  let initialScene = $state<ExcalidrawSceneData | null>(null)
  let sceneLoading = $state(!!data.sceneUrl)

  onMount(() => {
    if (!data.sceneUrl) return
    ;(async () => {
      try {
        const res = await fetch(data.sceneUrl!)
        if (!res.ok) throw new Error('Failed to fetch scene')
        initialScene = await res.json()
      } catch {
        toast.error('Failed to load the saved drawing')
      } finally {
        sceneLoading = false
      }
    })()
  })

  // ── Autosave ─────────────────────────────────────────────────────────────────
  // NOTE: no lock/collaboration — two tabs open on the same drawing is last-write-wins.
  type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
  let saveStatus = $state<SaveStatus>('idle')
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let pendingScene: ExcalidrawSceneData | null = null

  const SAVE_DEBOUNCE_MS = 1750

  function scheduleSave(elements: readonly unknown[], appState: Record<string, unknown>, files: Record<string, unknown>) {
    pendingScene = { elements: [...elements], appState, files }
    saveStatus = 'unsaved'
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { void flushSave() }, SAVE_DEBOUNCE_MS)
  }

  async function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
    if (!pendingScene) return
    const scene = pendingScene
    pendingScene = null
    saveStatus = 'saving'
    try {
      await excalidrawApi.saveScene(drawing.id, scene)
      saveStatus = 'saved'
    } catch (e) {
      pendingScene = scene // keep it so a later change (or manual retry) can resend it
      saveStatus = 'error'
      toast.error(e instanceof ApiError ? e.message : 'Failed to save drawing')
    }
  }

  // Flush a pending save before leaving the route...
  beforeNavigate(() => { void flushSave() })

  // ...and best-effort on a hard reload/tab close (browsers don't guarantee this
  // async call completes, but it's strictly better than silently dropping it).
  $effect(() => {
    if (!browser) return
    const handler = () => { void flushSave() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  })

  const saveStatusLabel = $derived.by(() => {
    switch (saveStatus) {
      case 'saving':  return 'Saving…'
      case 'saved':   return 'Saved'
      case 'unsaved': return 'Unsaved changes'
      case 'error':   return 'Failed to save'
      default:        return ''
    }
  })
</script>

<div class="editor-page">
  <div class="editor-header">
    <div class="editor-header-left">
      <a href="/excalidraw" class="back-link">← Drawings</a>
      <div class="title-row">
        {#if editingTitle}
          <input
            bind:value={titleInput}
            class="title-input"
            onkeydown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { editingTitle = false; titleInput = drawing.title } }}
          />
          <button class="icon-btn" onclick={saveTitle} disabled={savingTitle}><Check size={16} /></button>
          <button class="icon-btn" onclick={() => { editingTitle = false; titleInput = drawing.title }}><X size={16} /></button>
        {:else}
          <h1 class="drawing-title">{drawing.title}</h1>
          <button class="icon-btn" onclick={() => { editingTitle = true; titleInput = drawing.title }} title="Edit title"><Pencil size={15} /></button>
        {/if}
      </div>
      {#if drawing.description}<span class="drawing-desc">{drawing.description}</span>{/if}
    </div>
    <div class="editor-header-right">
      {#if saveStatusLabel}
        <span class="save-status" class:save-status--error={saveStatus === 'error'}>{saveStatusLabel}</span>
      {/if}
    </div>
  </div>

  <div class="editor-body">
    {#if sceneLoading}
      <div class="canvas-loading"><Spinner size={28} /></div>
    {:else if browser}
      <ExcalidrawCanvas
        initialData={initialScene}
        theme={$theme}
        onchange={scheduleSave}
      />
    {/if}
  </div>
</div>

<style>
  .editor-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--topbar-height) - 48px);
    gap: 12px;
  }
  @media (max-width: 1019px) {
    .editor-page { height: calc(100vh - var(--topbar-height) - 32px); }
  }

  .editor-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .editor-header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .editor-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }

  .back-link { font-size: 0.8125rem; color: var(--color-primary); text-decoration: none; }
  .back-link:hover { text-decoration: underline; }

  .title-row { display: flex; align-items: center; gap: 6px; }
  .drawing-title { font-size: 1.375rem; font-weight: 500; margin: 0; color: var(--color-text-primary); }
  .drawing-desc { font-size: 0.8125rem; color: var(--color-text-secondary); }

  .title-input {
    font-size: 1.1rem; font-weight: 600; border: 1px solid var(--color-primary);
    border-radius: 6px; padding: 4px 8px; background: var(--color-surface-0);
    color: var(--color-text-primary); outline: none; width: 300px;
  }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 6px; border: none; background: none;
    cursor: pointer; color: var(--color-text-secondary);
  }
  .icon-btn:hover:not(:disabled) { background: var(--color-surface-2); color: var(--color-text-primary); }
  .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .save-status { font-size: 0.8125rem; color: var(--color-text-secondary); }
  .save-status--error { color: var(--color-error); }

  .editor-body {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--color-surface-3);
    border-radius: 12px;
    overflow: hidden;
  }

  .canvas-loading {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-surface-1);
  }
</style>
