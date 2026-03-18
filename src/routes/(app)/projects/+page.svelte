<script lang="ts">
  import type { PageData } from './$types'
  import { goto, invalidateAll } from '$app/navigation'
  import { projectsApi } from '$lib/api/projects'
  import { ApiError } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import type { Project } from '$lib/types/project'
  import Button from '$lib/components/ui/Button.svelte'
  import EmptyState from '$lib/components/data/EmptyState.svelte'
  import DestructiveConfirmDialog from '$lib/components/dialogs/DestructiveConfirmDialog.svelte'
  import Modal from '$lib/components/dialogs/Modal.svelte'
  import { formatDate } from '$lib/utils/format'
  import { Plus, Layers, MoreVertical, Pencil, Trash2 } from 'lucide-svelte'

  let { data }: { data: PageData } = $props()

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
    deleting = true
    try {
      await projectsApi.remove(deleteTarget.id)
      toast.success('Project deleted')
      deleteTarget = null
      await invalidateAll()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed to delete project')
    } finally {
      deleting = false
    }
  }

  function closeMenu() { menuOpen = null }
</script>

<svelte:window onclick={closeMenu} />

<div class="page">
  <div class="page-header">
    <h1>Projects</h1>
    <Button onclick={openCreate}><Plus size={20} /> New Project</Button>
  </div>

  {#if data.projects.items.length === 0}
    <EmptyState
      title="No projects yet"
      message="Create a project to organise your notebooks, papers, and transcriptions."
    />
  {:else}
    <div class="projects-grid">
      {#each data.projects.items as project}
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
  message="This will permanently delete the project. The linked content will not be affected."
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
