import { create } from 'zustand'
import type { Toast, ToastKind } from '../types'

let seq = 0

type ToastState = {
  toasts: Toast[]
  push: (kind: ToastKind, text: string) => void
  dismiss: (id: number) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, text) =>
    set((state) => ({
      toasts: [...state.toasts, { id: ++seq, kind, text }].slice(-4),
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
