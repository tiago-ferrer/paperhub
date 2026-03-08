import { writable } from 'svelte/store'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

interface Toast { id: string; kind: ToastKind; message: string }

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([])
  const add = (kind: ToastKind, message: string) => {
    const id = crypto.randomUUID()
    update(t => [...t, { id, kind, message }])
    setTimeout(() => update(t => t.filter(x => x.id !== id)), 4000)
  }
  return {
    subscribe,
    success: (m: string) => add('success', m),
    error:   (m: string) => add('error', m),
    info:    (m: string) => add('info', m),
    warning: (m: string) => add('warning', m),
  }
}

export const toast = createToastStore()
