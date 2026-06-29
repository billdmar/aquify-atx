// useReviewStats — loads aggregate review stats (avg + count per fountainId)
// once on mount. In demo mode (no Firebase) getReviewStats resolves to {}
// immediately, so there's no loading flicker.

import { useEffect, useState } from 'react'
import { getReviewStats } from '../lib/firestore'
import { isFirebaseConfigured } from '../lib/firebase'

type ReviewStats = Record<string, { avg: number; count: number }>

interface UseReviewStatsResult {
  stats: ReviewStats
  loading: boolean
}

export function useReviewStats(): UseReviewStatsResult {
  const [stats, setStats] = useState<ReviewStats>({})
  // Only start in the loading state when there's a backend to load from.
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    let active = true
    getReviewStats()
      .then((data) => {
        if (active) setStats(data)
      })
      .catch(() => {
        if (active) setStats({})
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { stats, loading }
}
