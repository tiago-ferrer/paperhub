<!--
  Svelte wrapper around @excalidraw/excalidraw (React-only, no official Svelte build).
  Mounts a React root inside onMount and unmounts it in onDestroy.

  React + ReactDOM + @excalidraw/excalidraw are ~300-500KB gzip combined and are loaded
  100% dynamically (await import(...) inside onMount) so no top-level import of them ever
  reaches the vite build's prerender crawler — that crawler runs in Node, where
  `document`/`canvas` don't exist, and would break `npm run build` if React leaked into a
  file it visits (the /excalidraw list route, a layout, etc.). Same pattern already used
  for the ~500KB `mermaid` dependency in MarkdownContent.svelte. Only type-only imports
  from the package are allowed at the top of this file — they produce zero runtime JS.
-->
<script lang="ts">
  import { onMount } from 'svelte'
  import type { ExcalidrawImperativeAPI, ExcalidrawProps, ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types'
  import type { ExcalidrawSceneData } from '$lib/types/excalidraw'

  interface Props {
    initialData?: ExcalidrawSceneData | null
    theme?: 'light' | 'dark'
    onchange?: (elements: readonly unknown[], appState: Record<string, unknown>, files: Record<string, unknown>) => void
    onapi?: (api: ExcalidrawImperativeAPI) => void
  }

  let { initialData = null, theme = 'light', onchange, onapi }: Props = $props()

  let container = $state<HTMLDivElement | null>(null)
  let loadError = $state<string | null>(null)

  // Populated once the dynamic import resolves — see onMount below.
  let renderFn: ((props: ExcalidrawProps) => void) | null = null
  let root: import('react-dom/client').Root | null = null

  // AppState.collaborators is a runtime Map (SocketId -> Collaborator). JSON.stringify
  // silently turns a Map into `{}`, so any appState we've ever persisted has it as a
  // plain object rather than a Map — handing that back to Excalidraw as `initialData`
  // crashes deep inside its React tree the moment it calls `.forEach()` on it. Stripping
  // the key lets Excalidraw's own default-merge fill in a fresh Map instead, and doing
  // the same before forwarding onChange's appState keeps us from ever persisting a bad
  // one again.
  function stripCollaborators(appState: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
    if (!appState || !('collaborators' in appState)) return appState
    const { collaborators: _collaborators, ...rest } = appState
    return rest
  }

  function renderTree() {
    if (!renderFn) return
    const sanitizedInitialData = initialData
      ? { ...initialData, appState: stripCollaborators(initialData.appState) }
      : null
    renderFn({
      excalidrawAPI: (api) => onapi?.(api),
      // Cast at the boundary: our own ExcalidrawSceneData type deliberately keeps
      // `elements`/`appState`/`files` as unknown so nothing outside this wrapper couples
      // to the library's element/app-state shape.
      initialData: (sanitizedInitialData as ExcalidrawInitialDataState | null) ?? undefined,
      theme,
      onChange: (elements, appState, files) =>
        onchange?.(
          elements,
          stripCollaborators(appState as unknown as Record<string, unknown>) ?? {},
          files as unknown as Record<string, unknown>,
        ),
    })
  }

  onMount(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [reactMod, reactDomClientMod, excalidrawMod] = await Promise.all([
          import('react'),
          import('react-dom/client'),
          import('@excalidraw/excalidraw'),
          import('@excalidraw/excalidraw/index.css'),
        ])
        if (cancelled || !container) return

        root = reactDomClientMod.createRoot(container)
        renderFn = (props: ExcalidrawProps) => root!.render(reactMod.createElement(excalidrawMod.Excalidraw, props))
        renderTree()
      } catch (e) {
        console.error('[ExcalidrawCanvas] failed to load Excalidraw', e)
        if (!cancelled) loadError = 'Failed to load the drawing canvas. Please refresh the page.'
      }
    })()

    return () => {
      cancelled = true
      root?.unmount()
      root = null
    }
  })

  // Excalidraw doesn't re-seed the scene from a changed `initialData` prop after mount —
  // only the live theme needs a re-render of the React tree here.
  $effect(() => {
    void theme
    renderTree()
  })
</script>

<div class="excalidraw-canvas-wrapper">
  {#if loadError}
    <div class="canvas-error">{loadError}</div>
  {/if}
  <div class="excalidraw-canvas" bind:this={container}></div>
</div>

<style>
  .excalidraw-canvas-wrapper { width: 100%; height: 100%; position: relative; }
  .excalidraw-canvas { width: 100%; height: 100%; }
  .canvas-error {
    position: absolute; inset: 0; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-surface-1); color: var(--color-text-secondary);
    font-size: 0.875rem; text-align: center; padding: 24px;
  }
</style>
