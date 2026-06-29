// Toast context + useToast hook. Kept separate from ToastProvider.tsx so the
// component file only exports a component (react-refresh/only-export-components).

import { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastOptions {
  type?: ToastType
}

export interface ToastContextValue {
  toast: (msg: string, opts?: ToastOptions) => void
}

/**
 * Default value is a no-op dispatcher so consumers rendered without a
 * <ToastProvider> (e.g. in isolated unit tests) degrade gracefully rather than
 * crash — toasts are additive, non-critical UX.
 */
export const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
})

/** Access the toast dispatcher. No-ops outside a <ToastProvider>. */
export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}
