// FountainList.tsx — Responsive grid of FountainCard components.
// Sorts by distance when userLocation is known, else alphabetically by name.

import { memo, useMemo } from 'react'
import FountainCard from '../FountainCard/FountainCard'
import { haversineDistance } from '../../lib/geo'
import type { Fountain, LatLng } from '../../types'

interface FountainListProps {
  fountains?: Fountain[]
  userLocation?: LatLng | null
  onReview?: (f: Fountain) => void
  onLocate?: (f: Fountain) => void
  favoriteIds?: Set<string> | string[]
  onToggleSave?: (f: Fountain) => void
  stats?: Record<string, { avg: number; count: number }>
}

type AnnotatedFountain = Fountain & { distanceMiles: number | null }

function FountainList({
  fountains = [],
  userLocation = null,
  onReview,
  onLocate,
  favoriteIds,
  onToggleSave,
  stats,
}: FountainListProps) {
  // Normalize favorites to a Set for O(1) lookup; undefined → no save UI.
  const favoriteSet =
    favoriteIds instanceof Set
      ? favoriteIds
      : Array.isArray(favoriteIds)
        ? new Set(favoriteIds)
        : null

  // Annotate with distance when location is available, then sort: by distance
  // ascending when known, else alphabetically. Memoized so we only recompute
  // when the inputs change.
  const sorted = useMemo<AnnotatedFountain[]>(() => {
    const annotated: AnnotatedFountain[] = fountains.map((f) => ({
      ...f,
      distanceMiles: userLocation
        ? haversineDistance(userLocation.lat, userLocation.lng, f.lat, f.lng)
        : null,
    }))

    return [...annotated].sort((a, b) => {
      if (a.distanceMiles != null && b.distanceMiles != null) {
        return a.distanceMiles - b.distanceMiles
      }
      return a.name.localeCompare(b.name)
    })
  }, [fountains, userLocation])

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <span className="text-4xl" aria-hidden="true">🚿</span>
        <p className="text-gray-500 font-medium">No fountains match your filters.</p>
        <p className="text-sm text-gray-400">Try adjusting the search or removing some filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((fountain) => (
        <FountainCard
          key={fountain.id}
          fountain={fountain}
          distanceMiles={fountain.distanceMiles ?? undefined}
          onReview={onReview}
          onLocate={onLocate}
          saved={favoriteSet ? favoriteSet.has(fountain.id) : undefined}
          onToggleSave={onToggleSave}
          stats={stats?.[fountain.id]}
        />
      ))}
    </div>
  )
}

// Memoized: re-renders only when its props change. The list is rendered on
// pages that re-render for unrelated state (filters, theme), so skipping the
// sort/annotate work when fountains/location/handlers are unchanged is a win.
export default memo(FountainList)
