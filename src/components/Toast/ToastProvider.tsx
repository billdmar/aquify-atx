// ToastProvider — app-wide ephemeral notifications. Renders a fixed,
// bottom-center stack; each toast auto-dismisses after ~3s. The region is
// aria-live="polite" so screen readers announce messages without stealing
// focus. The hook + context live in toastContext.ts (react-refresh).

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ToastContext,
  type ToastOptions,
  type ToastType,
  type ToastContextValue,
} from './toastContext'

interface ToastItem {
  id: number
  msg: string
  type: ToastType
}

const AUTO_DISMISS_MS = 3000

const TYPE_CLASS: Record<ToastType, string> = {
  success: 'bg-green-600 text-white dark:bg-green-700',
  error: 'bg-red-600 text-white dark:bg-red-700',
  info: 'bg-slate-800 text-white dark:bg-slate-700',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  // Track pending timers so they can be cleared on unmount (no leaks/late setState).
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (msg: string, opts?: ToastOptions) => {
      const id = nextId.current++
      setToasts((list) => [...list, { id, msg, type: opts?.type ?? 'info' }])
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[2000] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-sm rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${TYPE_CLASS[t.type]}`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
