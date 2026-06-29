// useDocumentTitle — set the tab title for a route, restoring the previous
// title on unmount. Keeps a consistent " · Aquify ATX" suffix.

import { useEffect } from 'react'

const SUFFIX = 'Aquify ATX'

export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return
    const previous = document.title
    document.title = `${title} · ${SUFFIX}`
    return () => {
      document.title = previous
    }
  }, [title])
}
