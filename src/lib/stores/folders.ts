import { writable, get } from 'svelte/store'
import { foldersApi } from '$lib/api/folders'
import type { ReferenceFolder } from '$lib/types/folder'

// ── Tree helpers ──────────────────────────────────────────────────────────────

function mapTree(
  nodes: ReferenceFolder[],
  fn: (f: ReferenceFolder) => ReferenceFolder,
): ReferenceFolder[] {
  return nodes.map(f => {
    const mapped = fn(f)
    return { ...mapped, children: mapTree(mapped.children, fn) }
  })
}

function filterTree(
  nodes: ReferenceFolder[],
  keep: (f: ReferenceFolder) => boolean,
): ReferenceFolder[] {
  return nodes
    .filter(keep)
    .map(f => ({ ...f, children: filterTree(f.children, keep) }))
}

function findInTree(nodes: ReferenceFolder[], id: string): ReferenceFolder | null {
  for (const f of nodes) {
    if (f.id === id) return f
    const found = findInTree(f.children, id)
    if (found) return found
  }
  return null
}

// Returns flat list of all descendant IDs (not including the node itself)
function collectDescendantIds(nodes: ReferenceFolder[]): string[] {
  return nodes.flatMap(f => [f.id, ...collectDescendantIds(f.children)])
}

// ── Store ─────────────────────────────────────────────────────────────────────

const store = writable<ReferenceFolder[]>([])

export const folders = {
  subscribe: store.subscribe,

  /** Fetch the full tree from the API and replace the cache. */
  async load() {
    store.set(await foldersApi.list())
  },

  /** Snapshot the current tree — used for optimistic rollback. */
  snapshot(): ReferenceFolder[] {
    return get(store)
  },

  /** Restore a previous snapshot (call on API error after an optimistic mutation). */
  restore(snap: ReferenceFolder[]) {
    store.set(snap)
  },

  /** Optimistically insert a new folder returned by the API. */
  addFolder(folder: ReferenceFolder) {
    store.update(tree => {
      if (!folder.parent_id) return [...tree, folder]
      return mapTree(tree, f =>
        f.id === folder.parent_id
          ? { ...f, children: [...f.children, folder] }
          : f,
      )
    })
  },

  /** Optimistically rename a folder in place. */
  renameFolder(id: string, name: string) {
    store.update(tree => mapTree(tree, f => (f.id === id ? { ...f, name } : f)))
  },

  /**
   * Optimistically move a folder to a new parent (or root when newParentId is null).
   * Extracts the subtree, removes it from its current position, then inserts it
   * at the new location. The parent_id field is updated accordingly.
   */
  moveFolder(id: string, newParentId: string | null) {
    store.update(tree => {
      const node = findInTree(tree, id)
      if (!node) return tree
      const without = filterTree(tree, f => f.id !== id)
      const moved = { ...node, parent_id: newParentId }
      if (!newParentId) return [...without, moved]
      return mapTree(without, f =>
        f.id === newParentId
          ? { ...f, children: [...f.children, moved] }
          : f,
      )
    })
  },

  /** Optimistically remove a folder and all its visual descendants. */
  removeFolder(id: string) {
    store.update(tree => filterTree(tree, f => f.id !== id))
  },

  /**
   * Returns flat array of all descendant IDs for a given folder.
   * Used client-side to disable invalid drop targets during drag-and-drop.
   */
  findDescendantIds(id: string): string[] {
    const node = findInTree(get(store), id)
    return node ? collectDescendantIds(node.children) : []
  },

  /** Find a single folder by ID anywhere in the tree. */
  find(id: string): ReferenceFolder | null {
    return findInTree(get(store), id)
  },

  /** Flatten the entire tree into a depth-annotated list (useful for pickers). */
  flatten(nodes?: ReferenceFolder[], depth = 0): { folder: ReferenceFolder; depth: number }[] {
    const list = nodes ?? get(store)
    return list.flatMap(f => [
      { folder: f, depth },
      ...folders.flatten(f.children, depth + 1),
    ])
  },
}
