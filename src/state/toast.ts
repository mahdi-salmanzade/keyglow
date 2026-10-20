import { useSyncExternalStore } from 'react'

type Toast = { id: number; text: string }

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(text: string) {
  const id = nextId++
  toasts = [...toasts, { id, text }].slice(-3)
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 2600)
}

export const useToasts = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
    () => toasts,
  )
