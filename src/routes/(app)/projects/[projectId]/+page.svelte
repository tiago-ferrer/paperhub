<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { projectsApi } from '$lib/api/projects'
  import { notebooksApi } from '$lib/api/notebooks'
  import { transcriptionApi } from '$lib/api/transcription'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { ProjectItem, ProjectItemType, AddProjectItemPayload } from '$lib/types/project'
  import type { NotebookPost } from '$lib/types/notebook'
  import type { Transcription } from '$lib/types/transcription'
  import Button from '$lib/components/ui/Button.svelte'
  import SlideOver from '$lib/components/dialogs/SlideOver.svelte'
  import ConfirmDialog from '$lib/components/dialogs/ConfirmDialog.svelte'
  import Modal from '$lib/components/dialogs/Modal.svelte'
  import { formatDate } from '$lib/utils/format'
  import {
    Plus, Pencil, X, NotebookPen, Mic, FileText,
    BookOpen, FolderOpen, KanbanSquare, GanttChart as GanttIcon
  } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()
  let project = $derived(data.project)

  // Edit project modal
  let showEdit = $state(false)
  let editName = $state('')
  let editDesc = $state('')
  let saving = $state(false)

  // Remove item
  let removeTarget = $state<ProjectItem | null>(null)
  let removing = $state(false)

  // Add item slide-over
  let showAddItem = $state(false)
  let addType = $state<ProjectItemType>('NOTEBOOK')
  let addParentId = $state<string | null>(null)     // for NOTEBOOK_POST / TRANSCRIPTION
  let addEntityId = $state<string | null>(null)
  let subEntities = $state<NotebookPost[] | Transcription[]>([])
  let loadingSub = $state(false)
  let adding = $state(false)

  // Resolved names for NOTEBOOK_POST and TRANSCRIPTION items
  let resolvedNames = $state<Record<string, string>>({})

  // Resolve entity names for sub-type items on mount / project change
  $effect(() => {
    const postItems = project.items.filter(i => i.type === 'NOTEBOOK_POST')
    const txItems   = project.items.filter(i => i.type === 'TRANSCRIPTION')
    const allSub = [...postItems, ...txItems]
    for (const item of allSub) {
      if (resolvedNames[item.entity_id]) continue
      if (item.type === 'NOTEBOOK_POST' && item.parent_id) {
        notebooksApi.getPost(item.parent_id, item.entity_id)
          .then(p => { resolvedNames = { ...resolvedNames, [item.entity_id]: p.title } })
          .catch(() => {})
      } else if (item.type === 'TRANSCRIPTION' && item.parent_id) {
        transcriptionApi.getTranscription(item.parent_id, item.entity_id)
          .then(t => { resolvedNames = { ...resolvedNames, [item.entity_id]: t.name } })
          .catch(() => {})
      }
    }
  })

  // Grouped items
  const grouped = $derived({
    NOTEBOOK:            project.items.filter(i => i.type === 'NOTEBOOK'),
    TRANSCRIPTION_GROUP: project.items.filter(i => i.type === 'TRANSCRIPTION_GROUP'),
    PAPER:               project.items.filter(i => i.type === 'PAPER'),
    NOTEBOOK_POST:       project.items.filter(i => i.type === 'NOTEBOOK_POST'),
    TRANSCRIPTION:       project.items.filter(i => i.type === 'TRANSCRIPTION'),
    KANBAN_BOARD:        project.items.filter(i => i.type === 'KANBAN_BOARD'),
    GANTT_CHART:         project.items.filter(i => i.type === 'GANTT_CHART'),
  })

  // Already-added entity ids (for deduplication in add flow)
  const addedIds = $derived(new Set(project.items.map(i => i.entity_id)))

  function entityName(item: ProjectItem): string {
    if (item.type === 'NOTEBOOK') {
      return data.notebooks.find(n => n.id === item.entity_id)?.title ?? item.entity_id
    }
    if (item.type === 'TRANSCRIPTION_GROUP') {
      return data.groups.find(g => g.id === item.entity_id)?.name ?? item.entity_id
    }
    if (item.type === 'PAPER') {
      return data.references.find(p => p.id === item.entity_id)?.title ?? item.entity_id
    }
    if (item.type === 'KANBAN_BOARD') {
      return data.boards.find(b => b.id === item.entity_id)?.title ?? item.entity_id
    }
    if (item.type === 'GANTT_CHART') {
      return data.ganttCharts.find(c => c.id === item.entity_id)?.title ?? item.entity_id
    }
    // NOTEBOOK_POST and TRANSCRIPTION resolved async
    return resolvedNames[item.entity_id] ?? item.entity_id
  }

  function entityHref(item: ProjectItem): string {
    if (item.type === 'NOTEBOOK') return `/notebooks/${item.entity_id}`
    if (item.type === 'TRANSCRIPTION_GROUP') return `/transcription/${item.entity_id}`
    if (item.type === 'PAPER') return `/references/${item.entity_id}`
    if (item.type === 'NOTEBOOK_POST') return `/notebooks/${item.parent_id}/posts/${item.entity_id}`
    if (item.type === 'TRANSCRIPTION') return `/transcription/${item.parent_id}/${item.entity_id}`
    if (item.type === 'KANBAN_BOARD') return `/kanban/${item.entity_id}`
    if (item.type === 'GANTT_CHART') return `/gantt/${item.entity_id}`
    return '/'
  }

  function openEdit() {
    editName = project.name
    editDesc = project.description ?? ''
    showEdit = true
  }

  async function saveEdit() {
    if (!editName.trim()) return
    saving = true
    try {
      await projectsApi.patch(project.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      })
      toast.success('Project updated')
      showEdit = false
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update project')
    } finally {
      saving = false
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return
    removing = true
    try {
      await projectsApi.removeItem(project.id, removeTarget.id)
      removeTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to remove item')
    } finally {
      removing = false
    }
  }

  function openAddItem() {
    addType = 'NOTEBOOK'
    addParentId = null
    addEntityId = null
    subEntities = []
    showAddItem = true
  }

  function selectAddType(t: ProjectItemType) {
    addType = t
    addParentId = null
    addEntityId = null
    subEntities = []
  }

  async function selectParent(parentId: string) {
    addParentId = parentId
    addEntityId = null
    subEntities = []
    loadingSub = true
    try {
      if (addType === 'NOTEBOOK_POST') {
        const res = await notebooksApi.listPosts(parentId, 0, 100, false)
        subEntities = res.items
      } else if (addType === 'TRANSCRIPTION') {
        const res = await transcriptionApi.listTranscriptions(parentId, 0, 100, false)
        subEntities = res.items
      }
    } catch {
      toast.error('Failed to load items')
    } finally {
      loadingSub = false
    }
  }

  async function confirmAddItem() {
    if (!addEntityId) return
    adding = true
    const payload: AddProjectItemPayload = {
      type: addType,
      entity_id: addEntityId,
      parent_id: addParentId ?? undefined,
    }
    try {
      await projectsApi.addItem(project.id, payload)
      toast.success('Item added to project')
      showAddItem = false
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to add item')
    } finally {
      adding = false
    }
  }

  // Type metadata
  const TYPES: { type: ProjectItemType; label: string }[] = [
    { type: 'KANBAN_BOARD',        label: 'Kanban Board' },
    { type: 'GANTT_CHART',         label: 'Gantt Chart' },
    { type: 'PAPER',               label: 'Paper' },
    { type: 'NOTEBOOK',            label: 'Notebook' },
    { type: 'NOTEBOOK_POST',       label: 'Notebook Post' },
    { type: 'TRANSCRIPTION_GROUP', label: 'Transcription Group' },
    { type: 'TRANSCRIPTION',       label: 'Transcription' },
  ]

  const TYPE_BADGE: Record<ProjectItemType, string> = {
    NOTEBOOK:            'Notebook',
    TRANSCRIPTION_GROUP: 'Group',
    PAPER:               'Paper',
    KANBAN_BOARD:        'Board',
    GANTT_CHART:         'Gantt',
    NOTEBOOK_POST:       'Post',
    TRANSCRIPTION:       'Recording',
  }

  const SECTION_LABELS: Record<ProjectItemType, string> = {
    NOTEBOOK:            'Notebooks',
    TRANSCRIPTION_GROUP: 'Transcription Groups',
    PAPER:               'Papers',
    KANBAN_BOARD:        'Kanban Boards',
    GANTT_CHART:         'Gantt Charts',
    NOTEBOOK_POST:       'Posts',
    TRANSCRIPTION:       'Transcriptions',
  }
</script>

<div class="page">
  <div class="page-header">
    <div class="header-left">
      <a href="/projects" class="back-link">← Projects</a>
      <div class="title-row">
        <h1>{project.name}</h1>
        <button class="icon-btn" title="Edit project" onclick={openEdit}>
          <Pencil size={18} />
        </button>
      </div>
      {#if project.description}
        <p class="project-desc">{project.description}</p>
      {/if}
    </div>
    <div class="header-actions">
      <Button onclick={openAddItem}><Plus size={20} /> Add Content</Button>
    </div>
  </div>

  {#if project.items.length === 0}
    <div class="empty-project">
      <FolderOpen size={48} />
      <p>This project has no content yet.</p>
      <Button onclick={openAddItem}><Plus size={18} /> Add Content</Button>
    </div>
  {:else}
    <div class="sections">
      {#each TYPES as { type }}
        {#if grouped[type].length > 0}
          <section class="content-section">
            <h2 class="section-title">{SECTION_LABELS[type]}</h2>
            <div class="item-grid">
              {#each grouped[type] as item}
                <div class="item-card">
                  <div class="item-top">
                    <span class="type-badge type-badge--{type.toLowerCase()}">{TYPE_BADGE[type]}</span>
                    <button
                      class="remove-btn"
                      title="Remove from project"
                      onclick={() => removeTarget = item}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <a href={entityHref(item)} class="item-name" onclick={(e) => e.stopPropagation()}>
                    {entityName(item)}
                  </a>
                  <span class="item-date">Added {formatDate(item.added_at)}</span>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<!-- Edit project modal -->
<Modal open={showEdit} title="Edit Project" onclose={() => showEdit = false}>
  <form class="modal-form" onsubmit={(e) => { e.preventDefault(); saveEdit() }}>
    <div class="form-field">
      <label for="edit-name">Name</label>
      <input id="edit-name" bind:value={editName} placeholder="Project name" required />
    </div>
    <div class="form-field">
      <label for="edit-desc">Description <span class="optional">(optional)</span></label>
      <textarea id="edit-desc" bind:value={editDesc} rows={3} placeholder="What is this project about?"></textarea>
    </div>
    <div class="form-actions">
      <Button variant="text" onclick={() => showEdit = false}>Cancel</Button>
      <Button type="submit" loading={saving} disabled={!editName.trim()}>Save Changes</Button>
    </div>
  </form>
</Modal>

<!-- Remove item confirm -->
<ConfirmDialog
  open={!!removeTarget}
  title="Remove item?"
  message="This item will be removed from the project. The underlying content will not be affected."
  confirmLabel="Remove"
  onconfirm={confirmRemove}
  oncancel={() => removeTarget = null}
/>

<!-- Add item slide-over -->
<SlideOver open={showAddItem} title="Add to Project" width="520px" onclose={() => showAddItem = false}>
  <div class="add-flow">
    <!-- Type selector -->
    <div class="type-tabs">
      {#each TYPES as t}
        <button
          class="type-tab"
          class:active={addType === t.type}
          onclick={() => selectAddType(t.type)}
        >{t.label}</button>
      {/each}
    </div>

    <!-- Entity list -->
    <div class="entity-list">
      {#if addType === 'NOTEBOOK'}
        {#each data.notebooks as nb}
          {@const alreadyAdded = addedIds.has(nb.id)}
          <button
            class="entity-row"
            class:selected={addEntityId === nb.id}
            class:already-added={alreadyAdded}
            disabled={alreadyAdded}
            onclick={() => addEntityId = addEntityId === nb.id ? null : nb.id}
          >
            <NotebookPen size={18} />
            <span class="entity-label">{nb.title}</span>
            {#if alreadyAdded}<span class="added-chip">Added</span>{/if}
          </button>
        {/each}
        {#if data.notebooks.length === 0}
          <p class="empty-list">No notebooks found.</p>
        {/if}

      {:else if addType === 'TRANSCRIPTION_GROUP'}
        {#each data.groups as g}
          {@const alreadyAdded = addedIds.has(g.id)}
          <button
            class="entity-row"
            class:selected={addEntityId === g.id}
            class:already-added={alreadyAdded}
            disabled={alreadyAdded}
            onclick={() => addEntityId = addEntityId === g.id ? null : g.id}
          >
            <Mic size={18} />
            <span class="entity-label">{g.name}</span>
            {#if alreadyAdded}<span class="added-chip">Added</span>{/if}
          </button>
        {/each}
        {#if data.groups.length === 0}
          <p class="empty-list">No transcription groups found.</p>
        {/if}

      {:else if addType === 'PAPER'}
        {#each data.references as p}
          {@const alreadyAdded = addedIds.has(p.id)}
          <button
            class="entity-row"
            class:selected={addEntityId === p.id}
            class:already-added={alreadyAdded}
            disabled={alreadyAdded}
            onclick={() => addEntityId = addEntityId === p.id ? null : p.id}
          >
            <FileText size={18} />
            <span class="entity-label">{p.title}</span>
            {#if alreadyAdded}<span class="added-chip">Added</span>{/if}
          </button>
        {/each}
        {#if data.references.length === 0}
          <p class="empty-list">No references found.</p>
        {/if}

      {:else if addType === 'KANBAN_BOARD'}
        {#each data.boards as board}
          {@const alreadyAdded = addedIds.has(board.id)}
          <button
            class="entity-row"
            class:selected={addEntityId === board.id}
            class:already-added={alreadyAdded}
            disabled={alreadyAdded}
            onclick={() => addEntityId = addEntityId === board.id ? null : board.id}
          >
            <KanbanSquare size={18} />
            <span class="entity-label">{board.title}</span>
            {#if alreadyAdded}<span class="added-chip">Added</span>{/if}
          </button>
        {/each}
        {#if data.boards.length === 0}
          <p class="empty-list">No kanban boards found.</p>
        {/if}

      {:else if addType === 'GANTT_CHART'}
        {#each data.ganttCharts as chart}
          {@const alreadyAdded = addedIds.has(chart.id)}
          <button
            class="entity-row"
            class:selected={addEntityId === chart.id}
            class:already-added={alreadyAdded}
            disabled={alreadyAdded}
            onclick={() => addEntityId = addEntityId === chart.id ? null : chart.id}
          >
            <GanttIcon size={18} />
            <span class="entity-label">{chart.title}</span>
            {#if alreadyAdded}<span class="added-chip">Added</span>{/if}
          </button>
        {/each}
        {#if data.ganttCharts.length === 0}
          <p class="empty-list">No Gantt charts found.</p>
        {/if}

      {:else if addType === 'NOTEBOOK_POST'}
        {#if !addParentId}
          <p class="step-hint">Step 1: Choose a notebook</p>
          {#each data.notebooks as nb}
            <button
              class="entity-row"
              onclick={() => selectParent(nb.id)}
            >
              <NotebookPen size={18} />
              <span class="entity-label">{nb.title}</span>
            </button>
          {/each}
          {#if data.notebooks.length === 0}
            <p class="empty-list">No notebooks found.</p>
          {/if}
        {:else}
          <button class="back-btn" onclick={() => { addParentId = null; addEntityId = null; subEntities = [] }}>
            ← Back to notebooks
          </button>
          <p class="step-hint">Step 2: Choose a post</p>
          {#if loadingSub}
            <p class="loading-msg">Loading posts…</p>
          {:else}
            {#each (subEntities as NotebookPost[]) as post}
              {@const alreadyAdded = addedIds.has(post.id)}
              <button
                class="entity-row"
                class:selected={addEntityId === post.id}
                class:already-added={alreadyAdded}
                disabled={alreadyAdded}
                onclick={() => addEntityId = addEntityId === post.id ? null : post.id}
              >
                <BookOpen size={18} />
                <span class="entity-label">{post.title}</span>
                {#if alreadyAdded}<span class="added-chip">Added</span>{/if}
              </button>
            {/each}
            {#if (subEntities as NotebookPost[]).length === 0}
              <p class="empty-list">No posts in this notebook.</p>
            {/if}
          {/if}
        {/if}

      {:else if addType === 'TRANSCRIPTION'}
        {#if !addParentId}
          <p class="step-hint">Step 1: Choose a transcription group</p>
          {#each data.groups as g}
            <button
              class="entity-row"
              onclick={() => selectParent(g.id)}
            >
              <Mic size={18} />
              <span class="entity-label">{g.name}</span>
            </button>
          {/each}
          {#if data.groups.length === 0}
            <p class="empty-list">No transcription groups found.</p>
          {/if}
        {:else}
          <button class="back-btn" onclick={() => { addParentId = null; addEntityId = null; subEntities = [] }}>
            ← Back to groups
          </button>
          <p class="step-hint">Step 2: Choose a recording</p>
          {#if loadingSub}
            <p class="loading-msg">Loading recordings…</p>
          {:else}
            {#each (subEntities as Transcription[]) as tx}
              {@const alreadyAdded = addedIds.has(tx.id)}
              <button
                class="entity-row"
                class:selected={addEntityId === tx.id}
                class:already-added={alreadyAdded}
                disabled={alreadyAdded}
                onclick={() => addEntityId = addEntityId === tx.id ? null : tx.id}
              >
                <Mic size={18} />
                <span class="entity-label">{tx.name}</span>
                {#if alreadyAdded}<span class="added-chip">Added</span>{/if}
              </button>
            {/each}
            {#if (subEntities as Transcription[]).length === 0}
              <p class="empty-list">No recordings in this group.</p>
            {/if}
          {/if}
        {/if}
      {/if}
    </div>

    <div class="add-actions">
      <Button variant="text" onclick={() => showAddItem = false}>Cancel</Button>
      <Button
        loading={adding}
        disabled={!addEntityId}
        onclick={confirmAddItem}
      >Add to Project</Button>
    </div>
  </div>
</SlideOver>

<style>
  .page { max-width: 100%; }

  .page-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
  }
  .header-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .back-link { font-size: 0.875rem; color: var(--color-primary); text-decoration: none; }
  .title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .project-desc { margin: 4px 0 0; font-size: 0.875rem; color: var(--color-text-secondary); }
  .header-actions { flex-shrink: 0; }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

  .empty-project {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 16px; min-height: 300px; color: var(--color-text-secondary);
    border: 2px dashed var(--color-surface-3); border-radius: 12px;
  }
  .empty-project p { font-size: 0.9375rem; margin: 0; }

  .sections { display: flex; flex-direction: column; gap: 32px; }

  .section-title {
    font-size: 0.9375rem; font-weight: 500; margin: 0 0 12px;
    color: var(--color-text-secondary); text-transform: uppercase;
    letter-spacing: 0.04em; font-size: 0.75rem;
  }

  .item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }

  .item-card {
    background: var(--color-surface-0);
    border: 1px solid var(--color-surface-3);
    border-radius: 10px;
    padding: 14px;
    display: flex; flex-direction: column; gap: 8px;
    transition: border-color var(--transition-standard), box-shadow var(--transition-standard);
  }
  .item-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-1); }

  .item-top { display: flex; align-items: center; justify-content: space-between; }

  .type-badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-size: 0.6875rem; font-weight: 500;
  }
  .type-badge--notebook            { background: color-mix(in srgb, #6366f1 12%, transparent); color: #6366f1; }
  .type-badge--transcription_group { background: color-mix(in srgb, #0ea5e9 12%, transparent); color: #0ea5e9; }
  .type-badge--paper               { background: color-mix(in srgb, #22c55e 12%, transparent); color: #22c55e; }
  .type-badge--kanban_board        { background: color-mix(in srgb, #f97316 12%, transparent); color: #f97316; }
  .type-badge--gantt_chart         { background: color-mix(in srgb, #14b8a6 12%, transparent); color: #14b8a6; }
  .type-badge--notebook_post       { background: color-mix(in srgb, #a855f7 12%, transparent); color: #a855f7; }
  .type-badge--transcription       { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #f59e0b; }

  .remove-btn {
    display: flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border-radius: 50%; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-disabled);
    transition: background var(--transition-standard), color var(--transition-standard);
  }
  .remove-btn:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); }

  .item-name {
    font-size: 0.875rem; font-weight: 500; color: var(--color-text-primary);
    text-decoration: none; line-height: 1.4;
    overflow: hidden; text-overflow: ellipsis;
    display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;
  }
  .item-name:hover { color: var(--color-primary); }

  .item-date { font-size: 0.6875rem; color: var(--color-text-disabled); margin-top: auto; }

  /* Modal form */
  .modal-form { display: flex; flex-direction: column; gap: 16px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-field label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-primary); }
  .optional { font-weight: 400; color: var(--color-text-secondary); }
  .form-field input,
  .form-field textarea {
    padding: 8px 12px; border-radius: 6px; border: 1px solid var(--color-surface-3);
    background: var(--color-surface-0); color: var(--color-text-primary);
    font-size: 0.875rem; font-family: inherit; outline: none; resize: vertical;
    transition: border-color var(--transition-standard);
  }
  .form-field input:focus,
  .form-field textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-subtle); }
  .form-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }

  /* Add item slide-over */
  .add-flow { display: flex; flex-direction: column; gap: 20px; height: 100%; }

  .type-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
  .type-tab {
    padding: 6px 14px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer;
    color: var(--color-text-secondary); transition: all var(--transition-standard);
  }
  .type-tab:hover { background: var(--color-surface-2); }
  .type-tab.active {
    background: var(--color-primary-subtle); color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .entity-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }

  .step-hint { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 8px; font-weight: 500; }

  .entity-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; border: 1px solid transparent;
    background: transparent; cursor: pointer; text-align: left;
    font-size: 0.875rem; color: var(--color-text-primary);
    transition: background var(--transition-standard), border-color var(--transition-standard);
    width: 100%;
  }
  .entity-row:hover:not(:disabled) { background: var(--color-surface-1); }
  .entity-row.selected { background: var(--color-primary-subtle); border-color: var(--color-primary); }
  .entity-row.already-added { opacity: 0.5; cursor: not-allowed; }
  .entity-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .added-chip {
    flex-shrink: 0; padding: 1px 6px; border-radius: 8px;
    font-size: 0.6875rem; background: var(--color-surface-2); color: var(--color-text-secondary);
  }

  .back-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 0; border: none; background: transparent; cursor: pointer;
    font-size: 0.8125rem; color: var(--color-primary); margin-bottom: 8px;
  }
  .back-btn:hover { text-decoration: underline; }

  .loading-msg, .empty-list {
    font-size: 0.875rem; color: var(--color-text-secondary); margin: 8px 0; text-align: center;
  }

  .add-actions {
    display: flex; justify-content: flex-end; gap: 8px;
    padding-top: 16px; border-top: 1px solid var(--color-surface-2);
    flex-shrink: 0;
  }

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
    .header-actions { width: 100%; display: flex; justify-content: flex-end; }
    .item-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .item-grid { grid-template-columns: 1fr; }
  }
</style>
