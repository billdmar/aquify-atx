// FountainList.jsx — Responsive grid of FountainCard components.
// Sorts by distance when userLocation is known, else alphabetically by name.

import FountainCard from '../FountainCard/FountainCard'
import { haversineDistance } from '../../lib/geo'

/**
 * @param {{
 *   fountains: Array,
 *   userLocation: {lat:number,lng:number}|null,
 *   onReview?: (fountain: object) => void,
 *   onLocate?: (fountain: object) => void,
 * }} props
 */
export default function FountainList({
  fountains = [],
  userLocation = null,
  onReview,
  onLocate,
}) {
  // Annotate with distance when location is available
  const annotated = fountains.map((f) => ({
    ...f,
    distanceMiles: userLocation
      ? haversineDistance(userLocation.lat, userLocation.lng, f.lat, f.lng)
      : null,
  }))

  // Sort: by distance ascending when known, else alphabetically
  const sorted = [...annotated].sort((a, b) => {
    if (a.distanceMiles != null && b.distanceMiles != null) {
      return a.distanceMiles - b.distanceMiles
    }
    return a.name.localeCompare(b.name)
  })

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
          distanceMiles={fountain.distanceMiles}
          onReview={onReview}
          onLocate={onLocate}
        />
      ))}
    </div>
  )
}
