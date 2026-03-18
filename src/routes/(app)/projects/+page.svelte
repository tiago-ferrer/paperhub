<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { projectsApi } from '$lib/api/projects'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Project } from '$lib/types/project'
  import { formatTtlCountdown, formatDeletedAgo, isTtlExpired } from '$lib/utils/ttl'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import Modal from '$lib/components/dialogs/Modal.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Layers, MoreVertical, Pencil, Trash2, RotateCcw } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

  const activeProjects  = $derived(data.projects.items.filter(p => !p.deleted))
  const deletedProjects = $derived(data.projects.items.filter(p => p.deleted))

  // Create modal
  let showCreate = $state(false)
  let createName = $state('')
  let createDesc = $state('')
  let creating = $state(false)

  // Rename modal
  let renameTarget = $state<Project | null>(null)
  let renameName = $state('')
  let renameDesc = $state('')
  let renaming = $state(false)

  // Delete
  let deleteTarget = $state<Project | null>(null)
  let deleting = $state(false)
  let restoringIds = $state<Set<string>>(new Set())

  // Dropdown menu
  let menuOpen = $state<string | null>(null)

  function openCreate() {
    createName = ''
    createDesc = ''
    showCreate = true
  }

  async function createProject() {
    if (!createName.trim()) return
    creating = true
    try {
      await projectsApi.create({ name: createName.trim(), description: createDesc.trim() || undefined })
      toast.success('Project created')
      showCreate = false
      createName = ''
      createDesc = ''
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to create project')
    } finally {
      creating = false
    }
  }

  function openRename(p: Project) {
    renameTarget = p
    renameName = p.name
    renameDesc = p.description ?? ''
    menuOpen = null
  }

  async function confirmRename() {
    if (!renameTarget || !renameName.trim()) return
    renaming = true
    try {
      await projectsApi.patch(renameTarget.id, {
        name: renameName.trim(),
        description: renameDesc.trim() || undefined,
      })
      toast.success('Project updated')
      renameTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to update project')
    } finally {
      renaming = false
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleting = true
    deleteTarget = null
    try {
      await projectsApi.remove(target.id)
      let tid: string
      tid = toast.success(`"${target.name}" deleted.`, {
        duration: 8000,
        action: { label: 'Undo', onClick: () => undoDelete(target, tid) },
      })
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete project')
    } finally {
      deleting = false
    }
  }

  async function undoDelete(project: Project, toastId: string) {
    toast.dismiss(toastId)
    try {
      await projectsApi.restore(project.id)
      toast.success(`"${project.name}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this project.')
    }
  }

  async function restoreProject(project: Project) {
    restoringIds = new Set([...restoringIds, project.id])
    try {
      await projectsApi.restore(project.id)
      toast.success(`"${project.name}" restored.`)
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not restore this project.')
    } finally {
      restoringIds = new Set([...restoringIds].filter(id => id !== project.id))
    }
  }

  function toggleDeleted() {
    const params = new URLSearchParams()
    if (!data.includeDeleted) params.set('includeDeleted', 'true')
    goto(`/projects?${params}`)
  }

  function closeMenu() { menuOpen = null }
</script>

<svelte:window onclick={closeMenu} />

<div class="page">
  <div class="page-header">
    <h1>Projects</h1>
    <div class="header-actions">
      <button class="filter-chip" class:active={data.includeDeleted} onclick={toggleDeleted}>
        Recently Deleted
      </button>
      <Button onclick={openCreate}><Plus size={20} /> New Project</Button>
    </div>
  </div>

  {#if activeProjects.length === 0 && !data.includeDeleted}
    <EmptyState
      title="No projects yet"
      message="Create a project to organise your notebooks, papers, and transcriptions."
    />
  {:else if activeProjects.length > 0}
    <div class="projects-grid">
      {#each activeProjects as project}
        <div
          class="project-card"
          onclick={() => goto(`/projects/${project.id}`)}
          role="button"
          tabindex={0}
          onkeydown={(e) => e.key === 'Enter' && goto(`/projects/${project.id}`)}
        >
          <div class="card-top">
            <span class="card-title">{project.name}</span>
            <div
              class="menu-container"
              onclick={(e) => e.stopPropagation()}
              onkeydown={(e) => e.stopPropagation()}
              role="presentation"
            >
              <button
                class="icon-btn"
                onclick={(e) => { e.stopPropagation(); menuOpen = menuOpen === project.id ? null : project.id }}
                aria-label="Options"
              >
                <MoreVertical size={16} />
              </button>
              {#if menuOpen === project.id}
                <div class="dropdown-menu">
                  <button onclick={() => openRename(project)}>
                    <Pencil size={14} /> Rename
                  </button>
                  <button
                    class="danger"
                    onclick={() => { deleteTarget = project; menuOpen = null }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              {/if}
            </div>
          </div>

          {#if project.description}
            <p class="card-desc">{project.description}</p>
          {/if}

          <div class="card-footer">
            <div class="item-count">
              <Layers size={14} />
              <span>{project.items.length} item{project.items.length !== 1 ? 's' : ''}</span>
            </div>
            <span class="card-date">{formatDate(project.created_at)}</span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Recently Deleted section -->
  {#if data.includeDeleted}
    <div class="recently-deleted">
      <h2 class="section-heading">Recently Deleted</h2>
      {#if deletedProjects.length === 0}
        <p class="empty-deleted">No recently deleted projects.</p>
      {:else}
        <div class="deleted-list">
          {#each deletedProjects as project}
            <div class="deleted-row">
              <div class="deleted-info">
                <span class="deleted-name">{project.name}</span>
                <span class="deleted-meta">{formatDeletedAgo(project.deleted_at)}</span>
                <span class="deleted-ttl" class:ttl-warning={project.ttl_expiry && (project.ttl_expiry * 1000 - Date.now()) < 2 * 86400000} class:ttl-danger={project.ttl_expiry && (project.ttl_expiry * 1000 - Date.now()) < 86400000}>
                  {formatTtlCountdown(project.ttl_expiry)}
                </span>
              </div>
              <Button
                variant="outlined"
                size="sm"
                disabled={isTtlExpired(project.ttl_expiry) || restoringIds.has(project.id)}
                loading={restoringIds.has(project.id)}
                onclick={() => restoreProject(project)}
              >
                <RotateCcw size={14} /> Restore
              </Button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Create modal -->
<Modal open={showCreate} title="New Project" onclose={() => showCreate = false}>
  <form class="modal-form" onsubmit={(e) => { e.preventDefault(); createProject() }}>
    <div class="form-field">
      <label for="create-name">Name</label>
      <input id="create-name" bind:value={createName} placeholder="Project name" required />
    </div>
    <div class="form-field">
      <label for="create-desc">Description <span class="optional">(optional)</span></label>
      <textarea id="create-desc" bind:value={createDesc} rows={3} placeholder="What is this project about?"></textarea>
    </div>
    <div class="form-actions">
      <Button variant="text" onclick={() => showCreate = false}>Cancel</Button>
      <Button type="submit" loading={creating} disabled={!createName.trim()}>Create Project</Button>
    </div>
  </form>
</Modal>

<!-- Edit modal -->
<Modal open={!!renameTarget} title="Edit Project" onclose={() => renameTarget = null}>
  <form class="modal-form" onsubmit={(e) => { e.preventDefault(); confirmRename() }}>
    <div class="form-field">
      <label for="rename-name">Name</label>
      <input id="rename-name" bind:value={renameName} placeholder="Project name" required />
    </div>
    <div class="form-field">
      <label for="rename-desc">Description <span class="optional">(optional)</span></label>
      <textarea id="rename-desc" bind:value={renameDesc} rows={3} placeholder="What is this project about?"></textarea>
    </div>
    <div class="form-actions">
      <Button variant="text" onclick={() => renameTarget = null}>Cancel</Button>
      <Button type="submit" loading={renaming} disabled={!renameName.trim()}>Save Changes</Button>
    </div>
  </form>
</Modal>

<!-- Delete confirm -->
<DestructiveConfirmDialog
  open={!!deleteTarget}
  title="Delete project?"
  message="This project will be permanently deleted in 7 days. Linked content will not be affected. You can restore it from Recently Deleted."
  confirmPhrase={`I want to delete ${deleteTarget?.name ?? ''}`}
  confirmLabel="Delete"
  onconfirm={confirmDelete}
  oncancel={() => deleteTarget = null}
/>

<style>
  .page { max-width: 100%; }

  .page-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
  }
  .page-header h1 { margin: 0; font-size: 1.375rem; font-weight: 500; line-height: 1.3; }
  .header-actions { display: flex; align-items: center; gap: 8px; }

  .filter-chip {
    padding: 6px 16px; border-radius: 20px; border: 1px solid var(--color-surface-3);
    background: transparent; font-size: 0.8125rem; cursor: pointer; color: var(--color-text-secondary);
    transition: all var(--transition-standard);
  }
  .filter-chip:hover { background: var(--color-surface-2); }
  .filter-chip.active { background: var(--color-primary-subtle); color: var(--color-primary); border-color: var(--color-primary); }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .project-card {
    background: var(--color-surface-0);
    border: 1px solid var(--color-surface-3);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: box-shadow var(--transition-standard), border-color var(--transition-standard);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .project-card:hover { box-shadow: var(--shadow-2); border-color: var(--color-primary); }

  .card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .card-title { font-size: 0.9375rem; font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .menu-container { position: relative; flex-shrink: 0; }

  .dropdown-menu {
    position: absolute; top: calc(100% + 4px); right: 0; z-index: 20;
    background: var(--color-surface-0); border: 1px solid var(--color-surface-3);
    border-radius: 8px; box-shadow: var(--shadow-2); min-width: 140px;
    overflow: hidden;
  }
  .dropdown-menu button {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 9px 14px; border: none; background: transparent;
    cursor: pointer; font-size: 0.875rem; color: var(--color-text-primary);
    text-align: left;
    transition: background var(--transition-standard);
  }
  .dropdown-menu button:hover { background: var(--color-surface-2); }
  .dropdown-menu button.danger { color: var(--color-error); }
  .dropdown-menu button.danger:hover { background: color-mix(in srgb, var(--color-error) 8%, transparent); }

  .card-desc {
    font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0;
    overflow: hidden; text-overflow: ellipsis;
    display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;
  }

  .card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
  .item-count { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--color-text-secondary); }
  .card-date { font-size: 0.75rem; color: var(--color-text-disabled); }

  .icon-btn {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
    background: transparent; color: var(--color-text-secondary);
    transition: background var(--transition-standard);
  }
  .icon-btn:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

  /* Recently Deleted */
  .recently-deleted { margin-top: 40px; border-top: 1px solid var(--color-surface-3); padding-top: 24px; }
  .section-heading { margin: 0 0 16px; font-size: 1rem; font-weight: 500; color: var(--color-text-secondary); }
  .empty-deleted { font-size: 0.875rem; color: var(--color-text-disabled); margin: 0; }
  .deleted-list { display: flex; flex-direction: column; gap: 2px; }
  .deleted-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 10px 14px; border-radius: 8px;
    background: var(--color-surface-1); border: 1px solid var(--color-surface-2);
  }
  .deleted-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .deleted-name { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); text-decoration: line-through; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .deleted-meta { font-size: 0.75rem; color: var(--color-text-disabled); }
  .deleted-ttl { font-size: 0.75rem; color: var(--color-text-secondary); }
  .deleted-ttl.ttl-warning { color: var(--color-warning); }
  .deleted-ttl.ttl-danger  { color: var(--color-error); }

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

  @media (max-width: 1019px) {
    .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .projects-grid { grid-template-columns: 1fr; }
  }
</style>
