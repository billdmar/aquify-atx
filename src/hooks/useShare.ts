// useShare — native sharing via the Web Share API with a clipboard fallback.
// On platforms that expose `navigator.share` we hand off to the OS share sheet;
// otherwise we copy the URL to the clipboard and surface a brief "copied" flag
// so the UI can confirm the action. Dependency-free and SSR-safe.

import { useCallback, useEffect, useRef, useState } from 'react'

/** The payload shared to the OS share sheet or copied to the clipboard. */
export interface ShareData {
  title: string
  text?: string
  url: string
}

interface UseShareResult {
  /** Share the data natively, or fall back to copying the URL. */
  share: (data: ShareData) => Promise<void>
  /** True for ~2s after the clipboard fallback copies a URL. */
  justCopied: boolean
}

const COPIED_RESET_MS = 2000

export function useShare(): UseShareResult {
  const [justCopied, setJustCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current)
    }
  }, [])

  const share = useCallback(async (data: ShareData) => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(data)
      } catch (err) {
        // User-cancel (AbortError) is expected — swallow it. Re-throw anything
        // else so callers/tests can observe a genuine failure.
        if (err instanceof DOMException && err.name === 'AbortError') return
        throw err
      }
      return
    }

    // Fallback: copy the URL and flash the "copied" flag.
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(data.url)
      if (!mountedRef.current) return
      setJustCopied(true)
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) setJustCopied(false)
      }, COPIED_RESET_MS)
    }
  }, [])

  return { share, justCopied }
}
