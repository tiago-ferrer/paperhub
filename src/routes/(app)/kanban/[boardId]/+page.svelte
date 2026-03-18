<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { kanbanApi } from '$lib/api/kanban'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { KanbanBoard, KanbanCard, KanbanColumn, KanbanColumnPayload } from '$lib/types/kanban'
  import { renderMarkdown } from '$lib/utils/markdown'
  import Button from '$lib/components/ui/Button.svelte'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import AddToProjectModal from '$lib/components/projects/AddToProjectModal.svelte'
  import { Plus, Settings, Trash2, ChevronUp, ChevronDown, X, GripVertical, Check, Pencil, FolderOpen } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  // ── Local state ──────────────────────────────────────────────────────────────
  let board = $state<KanbanBoard>({ ...data.board, columns: [...data.board.columns] })
  let allCards = $state<KanbanCard[]>([...data.cards.items])
  let showDeleted = $state(data.includeDeleted)

  // Drag-and-drop
  let dragCardId     = $state<string | null>(null)
  let dragOverCardId = $state<string | null>(null)
  let dragBeforeCard = $state(true)
  let dragOverColId  = $state<string | null>(null)

  // Settings panel
  let showAddToProject = $state(false)
  let showSettings  = $state(false)
  let editColumns   = $state<KanbanColumnPayload[]>([])
  let savingSettings = $state(false)
  let deleteColTarget = $state<KanbanColumnPayload | null>(null)

  // Card detail / edit panel
  let selectedCard   = $state<KanbanCard | null>(null)
  let editingCard    = $state(false)
  let savingCard     = $state(false)
  let deleteCardTarget = $state<KanbanCard | null>(null)
  let editTitle      = $state('')
  let editDesc       = $state('')
  let editColId      = $state('')
  let editDueDate    = $state('')
  let editLabels     = $state<string[]>([])
  let labelInput     = $state('')

  // Inline add-card
  let addCardColId = $state<string | null>(null)
  let addCardTitle = $state('')
  let addingCard   = $state(false)

  // Inline rename column
  let renamingColId    = $state<string | null>(null)
  let renameColValue   = $state('')

  // ── Derived ──────────────────────────────────────────────────────────────────
  const sortedColumns = $derived([...board.columns].sort((a, b) => a.position - b.position))

  const cardsMap = $derived.by(() => {
    const map = new Map<string, KanbanCard[]>()
    for (const col of sortedColumns) map.set(col.id, [])
    const visible = showDeleted ? allCards : allCards.filter(c => !c.deleted)
    const sorted = [...visible].sort((a, b) => a.position - b.position)
    for (const card of sorted) {
      const list = map.get(card.column_id)
      if (list) list.push(card)
    }
    return map
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  function labelColor(label: string): string {
    const palette = ['#e57373','#81c784','#64b5f6','#ffb74d','#ba68c8','#4db6ac','#f06292','#aed581','#4fc3f7','#ffd54f']
    let h = 0
    for (let i = 0; i < label.length; i++) h = (Math.imul(31, h) + label.charCodeAt(i)) | 0
    return palette[Math.abs(h) % palette.length]
  }

  function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false
    return new Date(dueDate) < new Date(new Date().toDateString())
  }

  function formatDue(dueDate: string | null): string {
    if (!dueDate) return ''
    return new Date(dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  // ── Drag and Drop ─────────────────────────────────────────────────────────
  function onCardDragStart(e: DragEvent, card: KanbanCard) {
    dragCardId = card.id
    e.dataTransfer?.setData('text/plain', card.id)
    ;(e.currentTarget as HTMLElement).classList.add('dragging')
  }

  function onCardDragEnd(e: DragEvent) {
    dragCardId = null
    dragOverCardId = null
    dragOverColId = null
    ;(e.currentTarget as HTMLElement).classList.remove('dragging')
  }

  function onCardDragOver(e: DragEvent, card: KanbanCard) {
    if (card.id === dragCardId) return
    e.preventDefault()
    dragOverColId = null
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dragBeforeCard = e.clientY < rect.top + rect.height / 2
    dragOverCardId = card.id
  }

  function onColBodyDragOver(e: DragEvent, colId: string) {
    e.preventDefault()
    const target = e.target as HTMLElement
    // Only activate empty-column drop when not over a card
    if (target.closest('.kanban-card')) return
    dragOverCardId = null
    dragOverColId = colId
  }

  function onDrop(e: DragEvent, targetColId: string) {
    e.preventDefault()
    if (!dragCardId) return

    const srcCard = allCards.find(c => c.id === dragCardId)
    if (!srcCard) { dragCardId = null; return }

    // Build target column list without the dragged card
    const targetList = [...(cardsMap.get(targetColId) ?? [])].filter(c => c.id !== dragCardId)

    let targetIndex: number
    if (dragOverCardId) {
      const overIdx = targetList.findIndex(c => c.id === dragOverCardId)
      targetIndex = overIdx === -1 ? targetList.length : (dragBeforeCard ? overIdx : overIdx + 1)
    } else {
      targetIndex = targetList.length
    }

    // Update local state
    const idx = allCards.findIndex(c => c.id === dragCardId)
    if (idx !== -1) {
      allCards[idx] = { ...allCards[idx], column_id: targetColId, position: targetIndex }
    }

    // Persist
    kanbanApi.patchCard(board.id, dragCardId, { column_id: targetColId, position: targetIndex })
      .catch(err => toast.error(err instanceof ApiError ? err.message : 'Failed to move card'))

    dragCardId = null
    dragOverCardId = null
    dragOverColId = null
  }

  // ── Inline column rename ──────────────────────────────────────────────────
  function startRenameCol(col: KanbanColumn) {
    renamingColId = col.id
    renameColValue = col.name
  }

  async function saveRenameCol(col: KanbanColumn) {
    const name = renameColValue.trim()
    if (!name || name === col.name) { renamingColId = null; return }
    try {
      const newCols: KanbanColumnPayload[] = board.columns.map(c =>
        c.id === col.id ? { id: c.id, name, position: c.position, color: c.color } : { id: c.id, name: c.name, position: c.position, color: c.color }
      )
      const updated = await kanbanApi.patchBoard(board.id, { columns: newCols })
      board = { ...updated, columns: [...updated.columns] }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to rename column')
    } finally {
      renamingColId = null
    }
  }

  // ── Inline add card ───────────────────────────────────────────────────────
  function openAddCard(colId: string) {
    addCardColId = colId
    addCardTitle = ''
  }

  async function submitAddCard(colId: string) {
    if (!addCardTitle.trim()) { addCardColId = null; return }
    addingCard = true
    try {
      const colCards = cardsMap.get(colId) ?? []
      const card = await kanbanApi.createCard(board.id, {
        column_id: colId,
        title: addCardTitle.trim(),
        position: colCards.length,
      })
      allCards.push(card)
      addCardColId = null
      addCardTitle = ''
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create card')
    } finally {
      addingCard = false
    }
  }

  // ── Card detail ───────────────────────────────────────────────────────────
  function openCard(card: KanbanCard) {
    selectedCard = card
    editingCard = false
  }

  function startEditCard() {
    if (!selectedCard) return
    editTitle    = selectedCard.title
    editDesc     = selectedCard.description ?? ''
    editColId    = selectedCard.column_id
    editDueDate  = selectedCard.due_date ?? ''
    editLabels   = [...(selectedCard.labels ?? [])]
    labelInput   = ''
    editingCard  = true
  }

  async function saveCard() {
    if (!selectedCard) return
    savingCard = true
    try {
      const updated = await kanbanApi.patchCard(board.id, selectedCard.id, {
        title:       editTitle.trim() || selectedCard.title,
        description: editDesc.trim() || undefined,
        column_id:   editColId,
        due_date:    editDueDate || null,
        labels:      editLabels,
      })
      const idx = allCards.findIndex(c => c.id === selectedCard!.id)
      if (idx !== -1) allCards[idx] = updated
      selectedCard = updated
      editingCard = false
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to save card')
    } finally {
      savingCard = false
    }
  }

  async function deleteCard() {
    if (!deleteCardTarget) return
    try {
      await kanbanApi.removeCard(board.id, deleteCardTarget.id)
      const idx = allCards.findIndex(c => c.id === deleteCardTarget!.id)
      if (idx !== -1) allCards[idx] = { ...allCards[idx], deleted: true }
      if (selectedCard?.id === deleteCardTarget.id) selectedCard = null
      deleteCardTarget = null
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete card')
    }
  }

  function addLabel() {
    const l = labelInput.trim()
    if (l && !editLabels.includes(l)) editLabels.push(l)
    labelInput = ''
  }

  function removeLabel(label: string) {
    const i = editLabels.indexOf(label)
    if (i !== -1) editLabels.splice(i, 1)
  }

  // ── Settings panel ────────────────────────────────────────────────────────
  const DEFAULT_COLORS = ['#1a73e8','#34a853','#fbbc04','#ea4335','#9334ea','#00bcd4','#9aa0a6']

  function openSettings() {
    editColumns = board.columns
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(c => ({ id: c.id, name: c.name, position: c.position, color: c.color }))
    showSettings = true
  }

  function addSettingsColumn() {
    editColumns.push({
      name: '',
      position: editColumns.length,
      color: DEFAULT_COLORS[editColumns.length % DEFAULT_COLORS.length],
    })
  }

  function removeSettingsColumn(i: number) {
    const col = editColumns[i]
    // Warn if cards exist in this column
    const hasCards = allCards.some(c => !c.deleted && c.column_id === col.id)
    if (hasCards) {
      deleteColTarget = col
    } else {
      editColumns.splice(i, 1)
      editColumns.forEach((c, idx) => { c.position = idx })
    }
  }

  function confirmDeleteCol() {
    if (!deleteColTarget) return
    const i = editColumns.findIndex(c => c.id === deleteColTarget!.id)
    if (i !== -1) {
      editColumns.splice(i, 1)
      editColumns.forEach((c, idx) => { c.position = idx })
    }
    deleteColTarget = null
  }

  function moveColUp(i: number) {
    if (i === 0) return
    const tmp = editColumns[i]
    editColumns[i] = editColumns[i - 1]
    editColumns[i - 1] = tmp
    editColumns.forEach((c, idx) => { c.position = idx })
  }

  function moveColDown(i: number) {
    if (i === editColumns.length - 1) return
    const tmp = editColumns[i]
    editColumns[i] = editColumns[i + 1]
    editColumns[i + 1] = tmp
    editColumns.forEach((c, idx) => { c.position = idx })
  }

  async function saveSettings() {
    savingSettings = true
    try {
      const cols = editColumns
        .filter(c => c.name.trim())
        .map((c, i) => ({ ...c, name: c.name.trim(), position: i }))
      const updated = await kanbanApi.patchBoard(board.id, { columns: cols })
      board = { ...updated, columns: [...updated.columns] }
      showSettings = false
      toast.success('Board updated')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to save settings')
    } finally {
      savingSettings = false
    }
  }
</script>

<div class="board-page">
  <!-- Board header -->
  <div class="board-header">
    <div class="board-header-left">
      <a href="/kanban" class="back-link">← Boards</a>
      <h1 class="board-title">{board.title}</h1>
      {#if board.description}
        <span class="board-desc">{board.description}</span>
      {/if}
    </div>
    <div class="board-header-right">
      <button class="filter-chip" class:active={showDeleted} onclick={() => {
        showDeleted = !showDeleted
        const url = new URL(window.location.href)
        if (showDeleted) url.searchParams.set('includeDeleted', 'true')
        else url.searchParams.delete('includeDeleted')
        goto(url.pathname + url.search, { replaceState: true })
      }}>
        Show deleted
      </button>
      <Button variant="outlined" size="sm" onclick={() => showAddToProject = true}>
        <FolderOpen size={16} /> Add to Project
      </Button>
      <Button variant="outlined" size="sm" onclick={openSettings}>
        <Settings size={16} /> Settings
      </Button>
    </div>
  </div>

  <!-- Kanban columns -->
  <div class="columns-scroll">
    {#each sortedColumns as col}
      {@const colCards = cardsMap.get(col.id) ?? []}
      <div class="kanban-column">
        <!-- Column header -->
        <div class="col-header" style:border-top-color={col.color || 'var(--color-primary)'}>
          {#if renamingColId === col.id}
            <input
              class="col-rename-input"
              bind:value={renameColValue}
              onblur={() => saveRenameCol(col)}
              onkeydown={(e) => {
                if (e.key === 'Enter') saveRenameCol(col)
                if (e.key === 'Escape') renamingColId = null
              }}
              autofocus
            />
          {:else}
            <button class="col-name-btn" onclick={() => startRenameCol(col)}>
              {col.name}
            </button>
          {/if}
          <span class="col-count">{colCards.length}</span>
        </div>

        <!-- Column body (drop zone) -->
        <div
          class="col-body"
          class:drag-over-empty={dragOverColId === col.id && colCards.length === 0}
          ondragover={(e) => onColBodyDragOver(e, col.id)}
          ondrop={(e) => onDrop(e, col.id)}
          role="list"
          aria-label={col.name}
        >
          {#each colCards as card (card.id)}
            <div
              class="kanban-card"
              class:deleted-card={card.deleted}
              class:drag-over-before={dragOverCardId === card.id && dragBeforeCard}
              class:drag-over-after={dragOverCardId === card.id && !dragBeforeCard}
              draggable={!card.deleted}
              ondragstart={(e) => onCardDragStart(e, card)}
              ondragend={onCardDragEnd}
              ondragover={(e) => onCardDragOver(e, card)}
              onclick={() => openCard(card)}
              role="listitem"
            >
              {#if card.labels && card.labels.length > 0}
                <div class="card-labels">
                  {#each card.labels as label}
                    <span class="label-chip" style:background={labelColor(label)}>{label}</span>
                  {/each}
                </div>
              {/if}
              <div class="card-title" class:deleted-text={card.deleted}>{card.title}</div>
              {#if card.due_date}
                <div class="card-due" class:overdue={isOverdue(card.due_date)}>
                  {formatDue(card.due_date)}
                </div>
              {/if}
            </div>
          {/each}

          {#if dragOverColId === col.id && colCards.length === 0}
            <div class="drop-placeholder">Drop here</div>
          {/if}
        </div>

        <!-- Add card -->
        <div class="col-footer">
          {#if addCardColId === col.id}
            <div class="add-card-form">
              <textarea
                class="add-card-input"
                bind:value={addCardTitle}
                placeholder="Card title…"
                rows={2}
                onkeydown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAddCard(col.id) }
                  if (e.key === 'Escape') { addCardColId = null }
                }}
                autofocus
              ></textarea>
              <div class="add-card-actions">
                <Button size="sm" loading={addingCard} onclick={() => submitAddCard(col.id)}>Add</Button>
                <button class="icon-btn-sm" onclick={() => addCardColId = null}><X size={14} /></button>
              </div>
            </div>
          {:else}
            <button class="add-card-btn" onclick={() => openAddCard(col.id)}>
              <Plus size={14} /> Add card
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- Card detail / edit SlideOver -->
<SlideOver
  open={!!selectedCard}
  title={editingCard ? 'Edit Card' : 'Card Detail'}
  width="520px"
  onclose={() => { selectedCard = null; editingCard = false }}
>
  {#if selectedCard}
    <div class="card-detail">
      {#if !editingCard}
        <!-- View mode -->
        <div class="detail-header">
          <h2 class="detail-title" class:deleted-text={selectedCard.deleted}>{selectedCard.title}</h2>
          {#if selectedCard.deleted}<span class="deleted-badge">deleted</span>{/if}
        </div>

        <div class="detail-meta">
          <div class="meta-row">
            <span class="meta-label">Column</span>
            <span class="meta-value">{board.columns.find(c => c.id === selectedCard?.column_id)?.name ?? '—'}</span>
          </div>
          {#if selectedCard.due_date}
            <div class="meta-row">
              <span class="meta-label">Due</span>
              <span class="meta-value" class:overdue-text={isOverdue(selectedCard.due_date)}>
                {formatDue(selectedCard.due_date)}
                {#if isOverdue(selectedCard.due_date)}<span class="overdue-pill">Overdue</span>{/if}
              </span>
            </div>
          {/if}
          {#if selectedCard.labels && selectedCard.labels.length > 0}
            <div class="meta-row">
              <span class="meta-label">Labels</span>
              <div class="meta-labels">
                {#each selectedCard.labels as label}
                  <span class="label-chip" style:background={labelColor(label)}>{label}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        {#if selectedCard.description}
          <div class="detail-desc">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html renderMarkdown(selectedCard.description)}
          </div>
        {:else}
          <p class="no-desc">No description.</p>
        {/if}

        <div class="detail-actions">
          {#if !selectedCard.deleted}
            <Button variant="outlined" size="sm" onclick={startEditCard}><Pencil size={14} /> Edit</Button>
            <Button variant="text" size="sm" onclick={() => deleteCardTarget = selectedCard}>
              <Trash2 size={14} /> Delete
            </Button>
          {/if}
        </div>

      {:else}
        <!-- Edit mode -->
        <div class="edit-form">
          <div class="edit-field">
            <label class="field-label">Title <span class="req">*</span></label>
            <input class="field-input" type="text" bind:value={editTitle} placeholder="Card title" />
          </div>

          <div class="edit-field">
            <label class="field-label">Column</label>
            <select class="field-input" bind:value={editColId}>
              {#each sortedColumns as col}
                <option value={col.id}>{col.name}</option>
              {/each}
            </select>
          </div>

          <div class="edit-field">
            <label class="field-label">Due Date</label>
            <input class="field-input" type="date" bind:value={editDueDate} />
          </div>

          <div class="edit-field">
            <label class="field-label">Labels</label>
            <div class="label-editor">
              <div class="label-chips">
                {#each editLabels as label}
                  <span class="label-chip removable" style:background={labelColor(label)}>
                    {label}
                    <button class="label-remove" onclick={() => removeLabel(label)}><X size={10} /></button>
                  </span>
                {/each}
              </div>
              <div class="label-input-row">
                <input
                  class="field-input label-input"
                  type="text"
                  bind:value={labelInput}
                  placeholder="Add label…"
                  onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel() } }}
                />
                <Button size="sm" variant="outlined" onclick={addLabel}>Add</Button>
              </div>
            </div>
          </div>

          <div class="edit-field">
            <label class="field-label">Description (Markdown)</label>
            <textarea class="field-textarea" bind:value={editDesc} rows={8} placeholder="Describe this card…"></textarea>
          </div>

          <div class="edit-actions">
            <Button variant="text" onclick={() => editingCard = false}>Cancel</Button>
            <Button loading={savingCard} onclick={saveCard}><Check size={14} /> Save</Button>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</SlideOver>

<!-- Board settings SlideOver -->
<SlideOver open={showSettings} title="Board Settings" width="440px" onclose={() => showSettings = false}>
  <div class="settings-panel">
    <div class="settings-section">
      <div class="settings-section-header">
        <span class="settings-label">Columns</span>
        <button class="add-col-btn" onclick={addSettingsColumn}>
          <Plus size={14} /> Add column
        </button>
      </div>
      <div class="settings-cols">
        {#each editColumns as col, i}
          <div class="settings-col-row">
            <GripVertical size={16} class="drag-handle" />
            <input class="col-color" type="color" bind:value={col.color} title="Column colour" />
            <input class="col-name-input" type="text" bind:value={col.name} placeholder="Column name" />
            <div class="col-order-btns">
              <button class="order-btn" onclick={() => moveColUp(i)} disabled={i === 0} title="Move up"><ChevronUp size={14} /></button>
              <button class="order-btn" onclick={() => moveColDown(i)} disabled={i === editColumns.length - 1} title="Move down"><ChevronDown size={14} /></button>
            </div>
            <button class="icon-btn-sm danger" onclick={() => removeSettingsColumn(i)} title="Delete column"><Trash2 size={14} /></button>
          </div>
        {/each}
        {#if editColumns.length === 0}
          <p class="no-cols">No columns. Add one above.</p>
        {/if}
      </div>
    </div>
    <div class="settings-actions">
      <Button variant="outlined" onclick={() => showSettings = false}>Cancel</Button>
      <Button loading={savingSettings} onclick={saveSettings}>Save Changes</Button>
    </div>
  </div>
</SlideOver>

<!-- Delete card confirm -->
<DestructiveConfirmDialog
  open={!!deleteCardTarget}
  title="Delete card?"
  message="This card will be permanently deleted."
  confirmPhrase={`I want to delete ${deleteCardTarget?.title ?? ''}`}
  confirmLabel="Delete"
  onconfirm={deleteCard}
  oncancel={() => deleteCardTarget = null}
/>

<!-- Delete column confirm (has cards) -->
<DestructiveConfirmDialog
  open={!!deleteColTarget}
  title="Delete column with cards?"
  message="This column has cards assigned to it. The cards will remain but lose their column assignment. This cannot be undone."
  confirmPhrase={`I want to delete ${deleteColTarget?.name ?? ''}`}
  confirmLabel="Delete anyway"
  onconfirm={confirmDeleteCol}
  oncancel={() => deleteColTarget = null}
/>

<AddToProjectModal
  open={showAddToProject}
  entityType="KANBAN_BOARD"
  entityId={board.id}
  onclose={() => showAddToProject = false}
/>

<style>
  /* ── Board page layout ─────────────────────────────────────────────────── */
  .board-page { display: flex; flex-direction: column; height: 100%; }

  .board-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; margin-bottom: 20px; flex-wrap: wrap;
  }
  .board-header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .board-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
  .back-link { font-size: 0.8125rem; color: var(--color-primary); text-decoration: none; }
  .board-title { margin: 0; font-size: 1.375rem; font-weight: 500; }
  .board-desc { font-size: 0.875rem; color: var(--color-text-secondary); }

  .filter-chip {
    padding: 5px 14px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  /* ── Columns scroll container ──────────────────────────────────────────── */
  .columns-scroll {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 16px;
    flex: 1;
    align-items: flex-start;
  }
  .columns-scroll::-webkit-scrollbar { height: 6px; }
  .columns-scroll::-webkit-scrollbar-track { background: var(--color-surface-2); border-radius: 3px; }
  .columns-scroll::-webkit-scrollbar-thumb { background: var(--color-surface-3); border-radius: 3px; }

  /* ── Kanban column ─────────────────────────────────────────────────────── */
  .kanban-column {
    flex: 1 1 220px;
    min-width: 220px;
    background: var(--color-surface-1);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 200px);
  }

  .col-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px 8px;
    border-top: 3px solid var(--color-primary);
    border-radius: 10px 10px 0 0;
    flex-shrink: 0;
  }
  .col-name-btn {
    background: none; border: none; cursor: pointer; padding: 2px 4px; border-radius: 4px;
    font-size: 0.875rem; font-weight: 500; color: var(--color-text-primary);
    flex: 1; text-align: left; font-family: inherit;
  }
  .col-name-btn:hover { background: var(--color-surface-2); }
  .col-rename-input {
    flex: 1; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--color-primary);
    font-size: 0.875rem; font-weight: 500; font-family: inherit;
    background: var(--color-surface-0); color: var(--color-text-primary); outline: none;
    box-shadow: 0 0 0 2px var(--color-primary-subtle);
  }
  .col-count {
    font-size: 0.75rem; color: var(--color-text-disabled);
    background: var(--color-surface-2); border-radius: 10px;
    padding: 1px 6px; flex-shrink: 0; margin-left: 6px;
  }

  .col-body {
    flex: 1; overflow-y: auto; padding: 6px 8px; display: flex; flex-direction: column; gap: 6px;
    min-height: 40px;
  }
  .col-body::-webkit-scrollbar { width: 4px; }
  .col-body::-webkit-scrollbar-thumb { background: var(--color-surface-3); border-radius: 2px; }
  .drag-over-empty { background: color-mix(in srgb, var(--color-primary) 8%, transparent); border-radius: 6px; }

  .drop-placeholder {
    text-align: center; padding: 12px; font-size: 0.8125rem; color: var(--color-text-disabled);
    border: 2px dashed var(--color-primary); border-radius: 8px;
  }

  /* ── Kanban card ────────────────────────────────────────────────────────── */
  .kanban-card {
    background: var(--color-surface-0);
    border: 1px solid var(--color-surface-3);
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    transition: box-shadow var(--transition-standard);
    user-select: none;
  }
  .kanban-card:hover { box-shadow: var(--shadow-1); }
  .kanban-card.dragging { opacity: 0.5; }
  .deleted-card { opacity: 0.5; cursor: default; }
  .deleted-text { text-decoration: line-through; color: var(--color-text-disabled); }

  .drag-over-before { border-top: 2px solid var(--color-primary); }
  .drag-over-after  { border-bottom: 2px solid var(--color-primary); }

  .card-labels { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
  .label-chip {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 1px 7px; border-radius: 10px; font-size: 0.6875rem; font-weight: 500;
    color: #fff; white-space: nowrap;
  }
  .card-title { font-size: 0.875rem; line-height: 1.4; }
  .card-due {
    margin-top: 6px; font-size: 0.75rem; color: var(--color-text-secondary);
    background: var(--color-surface-2); display: inline-block;
    padding: 1px 6px; border-radius: 4px;
  }
  .card-due.overdue { background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); }

  /* ── Column footer / add card ─────────────────────────────────────────── */
  .col-footer { padding: 6px 8px 8px; flex-shrink: 0; }
  .add-card-btn {
    display: flex; align-items: center; gap: 4px;
    width: 100%; padding: 6px 8px; border-radius: 6px; border: none;
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: background var(--transition-standard); text-align: left; font-family: inherit;
  }
  .add-card-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

  .add-card-form { display: flex; flex-direction: column; gap: 6px; }
  .add-card-input {
    width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--color-primary);
    background: var(--color-surface-0); color: var(--color-text-primary); font-size: 0.875rem;
    font-family: inherit; outline: none; resize: none;
    box-shadow: 0 0 0 2px var(--color-primary-subtle);
    box-sizing: border-box;
  }
  .add-card-actions { display: flex; align-items: center; gap: 6px; }
  .icon-btn-sm {
    display: flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 4px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn-sm:hover { background: var(--color-surface-2); }
  .icon-btn-sm.danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  /* ── Card detail panel ────────────────────────────────────────────────── */
  .card-detail { display: flex; flex-direction: column; gap: 16px; }
  .detail-header { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
  .detail-title { margin: 0; font-size: 1.25rem; font-weight: 500; flex: 1; }
  .deleted-badge {
    display: inline-block; padding: 1px 6px; border-radius: 10px; align-self: center;
    font-size: 0.6875rem; background: color-mix(in srgb, var(--color-error) 12%, transparent);
    color: var(--color-error); font-weight: 500;
  }

  .detail-meta { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--color-surface-1); border-radius: 8px; }
  .meta-row { display: flex; align-items: flex-start; gap: 12px; font-size: 0.875rem; }
  .meta-label { font-weight: 500; color: var(--color-text-secondary); width: 60px; flex-shrink: 0; }
  .meta-value { color: var(--color-text-primary); }
  .meta-labels { display: flex; flex-wrap: wrap; gap: 4px; }
  .overdue-text { color: var(--color-error); }
  .overdue-pill { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 4px; font-size: 0.75rem; background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); }

  .detail-desc {
    font-size: 0.875rem; line-height: 1.6;
    border-top: 1px solid var(--color-surface-2); padding-top: 16px;
  }
  .detail-desc :global(h1), .detail-desc :global(h2), .detail-desc :global(h3) { font-size: 1em; margin: 12px 0 6px; }
  .detail-desc :global(p) { margin: 0 0 8px; }
  .detail-desc :global(code) { background: var(--color-surface-2); padding: 1px 4px; border-radius: 3px; font-size: 0.85em; }
  .detail-desc :global(pre) { background: var(--color-surface-2); padding: 12px; border-radius: 6px; overflow-x: auto; }
  .no-desc { font-size: 0.875rem; color: var(--color-text-disabled); margin: 0; }
  .detail-actions { display: flex; gap: 8px; padding-top: 8px; border-top: 1px solid var(--color-surface-2); }

  /* ── Edit form (inside card detail panel) ─────────────────────────────── */
  .edit-form { display: flex; flex-direction: column; gap: 14px; }
  .edit-field { display: flex; flex-direction: column; gap: 4px; }
  .field-label { font-size: 0.8125rem; font-weight: 500; color: var(--color-text-secondary); }
  .req { color: var(--color-error); }
  .field-input {
    padding: 8px 10px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 0.875rem; font-family: inherit; outline: none;
    transition: border-color var(--transition-standard);
  }
  .field-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  .field-textarea {
    padding: 8px 10px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 0.875rem; font-family: inherit; outline: none; resize: vertical;
    transition: border-color var(--transition-standard); width: 100%; box-sizing: border-box;
  }
  .field-textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }

  .label-editor { display: flex; flex-direction: column; gap: 6px; }
  .label-chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .label-chip.removable { cursor: default; padding-right: 4px; }
  .label-remove {
    display: inline-flex; align-items: center; background: none; border: none; cursor: pointer;
    padding: 0; color: inherit; opacity: 0.8;
  }
  .label-remove:hover { opacity: 1; }
  .label-input-row { display: flex; gap: 8px; }
  .label-input { flex: 1; }
  .edit-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; border-top: 1px solid var(--color-surface-2); }

  /* ── Settings panel ─────────────────────────────────────────────────── */
  .settings-panel { display: flex; flex-direction: column; gap: 24px; }
  .settings-section { display: flex; flex-direction: column; gap: 10px; }
  .settings-section-header { display: flex; align-items: center; justify-content: space-between; }
  .settings-label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); }
  .add-col-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 6px; border: 1px dashed var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-primary);
    transition: background var(--transition-standard); font-family: inherit;
  }
  .add-col-btn:hover { background: var(--color-primary-subtle); }
  .settings-cols { display: flex; flex-direction: column; gap: 6px; }
  .settings-col-row { display: flex; align-items: center; gap: 6px; }
  .col-color { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--color-surface-3); cursor: pointer; padding: 2px; flex-shrink: 0; }
  .col-name-input {
    flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary); font-size: 0.875rem;
    font-family: inherit; outline: none;
  }
  .col-name-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  .col-order-btns { display: flex; flex-direction: column; gap: 1px; flex-shrink: 0; }
  .order-btn {
    display: flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 3px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .order-btn:disabled { opacity: 0.3; cursor: default; }
  .order-btn:not(:disabled):hover { background: var(--color-surface-2); }
  .no-cols { font-size: 0.875rem; color: var(--color-text-disabled); margin: 0; text-align: center; padding: 16px; }
  .settings-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; border-top: 1px solid var(--color-surface-2); }

  @media (max-width: 1019px) {
    /* Header */
    .board-header { flex-direction: column; gap: 10px; margin-bottom: 14px; }
    .board-header-right { width: 100%; justify-content: flex-end; }

    /* Columns stack vertically, full width, no horizontal scroll */
    .columns-scroll {
      flex-direction: column;
      overflow-x: visible;
      align-items: stretch;
      gap: 10px;
      padding-bottom: 24px;
    }

    /* Each column is full width and not height-constrained */
    .kanban-column { width: 100%; max-height: none; }

    /* Let column body expand naturally — page scrolls instead */
    .col-body { overflow-y: visible; max-height: none; }

    /* SlideOvers full width on mobile */
    :global(.slide-over) { width: 100% !important; }
  }
</style>
