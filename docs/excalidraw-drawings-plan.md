# Excalidraw Drawings — Frontend Plan

Permite que cada usuário crie múltiplos desenhos Excalidraw (lista + editor), seguindo os padrões de Kanban/Gantt já existentes no app, e os associe a Projects. Depende da API descrita em `scholaflow-backend/docs/excalidraw-drawings-spec.md` (branch `feature/excalidraw-drawings`).

## Antes de começar

1. Criar uma branch a partir de `main`: `feature/excalidraw-drawings`.
2. Fazer commits lógicos, um por etapa (não um commit único no final):
   1. `types` + `api` (`excalidraw.ts` em `types/` e `api/`)
   2. `stores` (sidebar) + `navigation.ts` + `Sidebar.svelte`
   3. `Breadcrumb.svelte`
   4. rota de lista (`excalidraw/+page.ts` + `+page.svelte`)
   5. componente wrapper `ExcalidrawCanvas.svelte` (spike isolado — validar mount/unmount do React antes de integrar)
   6. rota de detalhe/editor (`excalidraw/[drawingId]/+page.ts` + `+page.svelte`) com autosave
   7. integração com Projects (`project.ts`, `[projectId]/+page.ts`, `[projectId]/+page.svelte`, `AddToProjectModal` na tela de detalhe)
   8. `npm run check` + `npm run build && npm run preview` (valida o crawler de prerender do build estático) antes de abrir o PR
3. Abrir PR contra `main` só depois do build de produção local passar.

## Decisão de arquitetura: Excalidraw é React, o app é Svelte

`@excalidraw/excalidraw` só existe como pacote React — não há build Svelte/web component oficial. Novas dependências: `react`, `react-dom`, `@excalidraw/excalidraw`.

- Criar wrapper `src/lib/components/excalidraw/ExcalidrawCanvas.svelte` que monta uma raiz React via `ReactDOM.createRoot()` dentro de `onMount` e desmonta em `onDestroy`.
- **Import 100% dinâmico** (`await import(...)`) dentro do `onMount` — nunca no topo do arquivo. Mesmo padrão já usado no projeto para o `mermaid` (~500KB) em [`MarkdownContent.svelte`](src/lib/components/ui/MarkdownContent.svelte:9): "loaded on demand only when a diagram actually shows up".
- Expor `excalidrawAPI` via callback ref para o Svelte pai poder chamar `updateScene`, `exportToBlob`, etc.
- Sincronizar o tema claro/escuro do app com a prop `theme` do Excalidraw.

### Por que isso não quebra em produção

O app é buildado com `adapter-static` + `fallback: 'index.html'` ([svelte.config.js](svelte.config.js)) e deployado como SPA estática (scp direto pra um nginx, sem Node runtime — ver [.github/workflows/deploy.yml](.github/workflows/deploy.yml)). Não há SSR real em runtime, então rotas dinâmicas como `/excalidraw/[drawingId]` já funcionam do mesmo jeito que Kanban/Gantt funcionam hoje.

**Único cuidado:** o `vite build` roda um crawler de prerender em Node. Se o import do Excalidraw/React vazar para o topo de qualquer arquivo alcançável por esse crawler (a lista `/excalidraw`, um layout), o build quebra porque `document`/`canvas` não existem em Node. Mitigação: import dinâmico estritamente dentro de `onMount`, e testar `npm run build && npm run preview` localmente antes do PR (não há staging — deploy é direto em `main`).

Bundle: React + ReactDOM + `@excalidraw/excalidraw` somam ~300–500kB gzip, mas como é `import()` dinâmico isso vira um chunk separado, carregado só ao abrir um drawing — não afeta o shell principal.

## 1. Types (`src/lib/types/excalidraw.ts`)

```ts
export interface ExcalidrawDrawing {
  id: string
  owner: string
  title: string
  description: string
  has_scene: boolean
  has_thumbnail: boolean
  created_at: string
  updated_at: string
  deleted: boolean
  deleted_at: string | null
}

export interface ExcalidrawSceneData {
  elements: unknown[]              // ExcalidrawElement[] da lib — unknown pra não acoplar o tipo
  appState: Record<string, unknown>
  files?: Record<string, unknown>  // imagens embutidas (dataURL) — ver "Anexos" abaixo
}

export interface CreateExcalidrawDrawingPayload { title: string; description?: string }
export type PatchExcalidrawDrawingPayload = Partial<CreateExcalidrawDrawingPayload>
```

## 2. API (`src/lib/api/excalidraw.ts`)

Padrão `makeExcalidrawApi(fetchFn?)`, igual a [`kanban.ts`](src/lib/api/kanban.ts):

```ts
const BASE = '/api/v1/excalidraw'

export function makeExcalidrawApi(fetchFn?: typeof fetch) {
  const a = fetchFn ? makeApi(fetchFn) : api
  return {
    listDrawings: (page = 0, size = 20, includeDeleted = false) => {
      const params = new URLSearchParams({ page: String(page), size: String(size), includeDeleted: String(includeDeleted) })
      return a.get<PageResult<ExcalidrawDrawing>>(`${BASE}/drawings?${params}`)
    },
    getDrawing:    (id: string) => a.get<ExcalidrawDrawing>(`${BASE}/drawings/${id}`),
    createDrawing: (payload: CreateExcalidrawDrawingPayload) => a.post<ExcalidrawDrawing>(`${BASE}/drawings`, payload),
    patchDrawing:  (id: string, payload: PatchExcalidrawDrawingPayload) => a.patch<ExcalidrawDrawing>(`${BASE}/drawings/${id}`, payload),
    removeDrawing: (id: string) => a.delete<void>(`${BASE}/drawings/${id}`),
    restoreDrawing:(id: string) => a.put<ExcalidrawDrawing>(`${BASE}/drawings/${id}/restore`, {}),

    // Cena: upload multipart, download via presigned URL (não passa o JSON pela própria API de novo)
    saveScene:   (id: string, scene: ExcalidrawSceneData) => {
      const form = new FormData()
      form.append('file', new Blob([JSON.stringify(scene)], { type: 'application/json' }), 'scene.json')
      return a.putForm<ExcalidrawDrawing>(`${BASE}/drawings/${id}/scene`, form)
    },
    getSceneUrl: (id: string) => a.get<{ url: string }>(`${BASE}/drawings/${id}/scene/url`),
  }
}

export const excalidrawApi = makeExcalidrawApi()
```

> Se `client.ts` não tiver um helper `putForm`/multipart ainda, checar como `references.ts`/`notebooks.ts` fazem upload de attachment e replicar o mesmo helper.

## 3. Store da sidebar (`src/lib/stores/excalidrawDrawings.ts`)

Mesmo padrão de [`kanbanBoards.ts`](src/lib/stores/kanbanBoards.ts) — `writable<ExcalidrawDrawing[]>([])` + `refreshExcalidrawDrawings()` silencioso.

## 4. Navegação (`src/lib/config/navigation.ts`)

Item "Excalidraw" com ícone lucide (`PenTool` ou `Shapes`), rota `/excalidraw`.

## 5. Sidebar (`src/lib/components/layout/Sidebar.svelte`)

Submenu expansível com os drawings recentes + "New drawing", mesmo padrão de Kanban/Gantt: `nav-item-wrapper` com `has-submenu`, chevron de toggle, `refreshExcalidrawDrawings()` no `onMount` existente.

## 6. Breadcrumb (`src/lib/components/layout/Breadcrumb.svelte`)

Adicionar `excalidraw?: ExcalidrawDrawing` na tipagem de `data` e o bloco de resolução `Feature > título do drawing`.

## 7. Lista (`src/routes/(app)/excalidraw/`)

`+page.ts`: carrega `listDrawings(page, 20, includeDeleted)` a partir de `url.searchParams`.

`+page.svelte`: grid de cards (título, atualizado em, badge "deleted"), modal de criação (só título + descrição opcional — igual ao template padrão de Kanban/Gantt), toggle "Show deleted", paginação, `ConfirmDialog` de soft delete. Estrutura idêntica à de [`kanban/+page.svelte`](src/routes/(app)/kanban/+page.svelte).

## 8. Editor (`src/routes/(app)/excalidraw/[drawingId]/`)

`+page.ts`:
```ts
export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const api = makeExcalidrawApi(fetch)
    const drawing = await api.getDrawing(params.drawingId)
    const sceneUrl = drawing.has_scene ? await api.getSceneUrl(params.drawingId) : null
    return { drawing, excalidraw: drawing, sceneUrl: sceneUrl?.url ?? null }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw error(404, 'Not found')
    throw e
  }
}
```

`+page.svelte`:
- Header padrão (back-link, título editável inline, `AddToProjectModal`) — igual ao header de Kanban/Gantt.
- Corpo: `{#if browser}<ExcalidrawCanvas ... />{/if}` (import `browser` de `$app/environment`), ocupando a área abaixo do header (`height: calc(100vh - var(--topbar-height) - <header height>)`).
- Se `data.sceneUrl`, faz `fetch(data.sceneUrl)` no client pra buscar o JSON da cena direto do S3 e passa como `initialData` pro `ExcalidrawCanvas`.
- Indicador "Salvando… / Salvo / Alterações não salvas" no `feature-header-right`.

### Autosave

- `onChange` do Excalidraw → debounce ~1.5–2s → `excalidrawApi.saveScene(id, { elements, appState, files })`.
- Flush do debounce pendente em `beforeNavigate` (`$app/navigation`) e `window.beforeunload`.
- Renomear título é um PATCH separado e imediato (padrão inline-edit já usado em Kanban/Gantt).
- Limitação conhecida (documentar, não resolver agora): sem lock/colaboração — duas abas abertas no mesmo drawing = last-write-wins.

### Anexos/imagens embutidas (fases)

- **MVP:** `files` (imagens coladas no canvas) vai inline como dataURL dentro do próprio `scene_data` — simples, mas infla o payload.
- **Fase 2:** extrair cada arquivo pra upload via attachment (padrão de `notebooks`/`references`), trocando dataURL por URL hospedada.

### Thumbnails (fase 2)

`exportToBlob` do Excalidraw gera um PNG da cena → upload via endpoint de thumbnail do backend → exibir nos cards da lista em vez do ícone genérico.

## 9. Integração com Projects

**`src/lib/types/project.ts`** — adicionar ao union:
```ts
export type ProjectItemType = /* ... */ | 'EXCALIDRAW_DRAWING'
```

**`src/routes/(app)/projects/[projectId]/+page.ts`** — entra no batch degradável (`settle`) que já busca boards/charts:
```ts
const [notebooks, groups, references, boards, ganttCharts, drawings] = await Promise.all([
  ...,
  settle(makeExcalidrawApi(fetch).listDrawings(0, 100, false)),
])
return { ..., drawings: toSection(drawings) }
```

**`src/routes/(app)/projects/[projectId]/+page.svelte`** — mesmo shape de `KANBAN_BOARD`/`GANTT_CHART` (item "flat", sem `parentId`):
- `grouped.EXCALIDRAW_DRAWING = project.items.filter(i => i.type === 'EXCALIDRAW_DRAWING')`
- `entityName()`: resolve via `data.drawings.items.find(d => d.id === item.entity_id)?.title`
- `entityHref()`: `/excalidraw/${item.entity_id}`
- `TYPES`, `TYPE_BADGE`, `SECTION_LABELS` — nova entrada em cada um
- branch `{:else if addType === 'EXCALIDRAW_DRAWING'}` no slide-over de adicionar item

**Editor do drawing** — botão "Add to Project" reaproveitando `AddToProjectModal.svelte` sem alterá-lo:
```svelte
<AddToProjectModal entityType="EXCALIDRAW_DRAWING" entityId={drawing.id} bind:open={showAddToProject} />
```
(mesmo uso de [`gantt/[chartId]/+page.svelte:851`](src/routes/(app)/gantt/[chartId]/+page.svelte:851) e [`kanban/[boardId]/+page.svelte:668`](src/routes/(app)/kanban/[boardId]/+page.svelte:668)).

## Verificação

- `npm run check` (0 erros) ao final de cada etapa.
- `npm run build && npm run preview` antes do PR — reproduz o crawler de prerender do CI e pega qualquer import indevido do Excalidraw fora do `onMount`.
- Manual: criar/editar/renomear/soft-delete/restore de um drawing; refresh mantendo o desenho; alternância de tema claro/escuro dentro do canvas; navegar pra fora do editor com alterações pendentes (autosave dá flush); adicionar/remover um drawing de um Project.

## Fora de escopo

- Colaboração em tempo real entre usuários no mesmo drawing.
- Compartilhamento com outros usuários (padrão `viewer` de references) — extensão futura.
