import { writable } from 'svelte/store'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  kind: ToastKind
  message: string
  action?: ToastAction
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([])

  const remove = (id: string) => update(t => t.filter(x => x.id !== id))

  const add = (kind: ToastKind, message: string, opts?: { duration?: number; action?: ToastAction }): string => {
    const id = crypto.randomUUID()
    update(t => [...t, { id, kind, message, action: opts?.action }])
    setTimeout(() => remove(id), opts?.duration ?? 4000)
    return id
  }

  return {
    subscribe,
    success: (m: string, opts?: { duration?: number; action?: ToastAction }) => add('success', m, opts),
    error:   (m: string) => add('error', m),
    info:    (m: string) => add('info', m),
    warning: (m: string) => add('warning', m),
    dismiss: remove,
  }
}

export const toast = createToastStore()
