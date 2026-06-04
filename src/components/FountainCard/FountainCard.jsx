// FountainCard.jsx — Presentational card for a single fountain listing.

const TYPE_LABELS = {
  fountain: 'Drinking Fountain',
  'bottle-filler': 'Bottle Filler',
  both: 'Fountain + Bottle Filler',
}

const TYPE_BADGE_CLASSES = {
  fountain: 'bg-blue-100 text-blue-700',
  'bottle-filler': 'bg-green-100 text-green-700',
  both: 'bg-purple-100 text-purple-700',
}

const STATUS_CLASSES = {
  active: 'bg-green-100 text-green-700',
  unverified: 'bg-amber-100 text-amber-700',
  inactive: 'bg-gray-100 text-gray-500',
}

const STATUS_DOTS = {
  active: 'bg-green-500',
  unverified: 'bg-amber-500',
  inactive: 'bg-gray-400',
}

/**
 * @param {{
 *   fountain: object,
 *   distanceMiles?: number,
 *   onReview?: (fountain: object) => void,
 *   onLocate?: (fountain: object) => void,
 * }} props
 */
export default function FountainCard({
  fountain,
  distanceMiles,
  onReview,
  onLocate,
}) {
  const typeBadge = TYPE_BADGE_CLASSES[fountain.type] ?? 'bg-gray-100 text-gray-600'
  const typeLabel = TYPE_LABELS[fountain.type] ?? fountain.type
  const statusClass = STATUS_CLASSES[fountain.status] ?? STATUS_CLASSES.inactive
  const statusDot = STATUS_DOTS[fountain.status] ?? STATUS_DOTS.inactive

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">
          {fountain.name}
        </h3>
        {distanceMiles != null && (
          <span className="shrink-0 text-xs text-aqua-700 font-medium">
            {distanceMiles.toFixed(1)} mi
          </span>
        )}
      </div>

      {/* Address */}
      <p className="text-xs text-gray-500 leading-snug">{fountain.address}</p>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type badge */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge}`}>
          {typeLabel}
        </span>

        {/* Status pill */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} aria-hidden="true" />
          {fountain.status}
        </span>

        {/* Accessibility */}
        {fountain.accessible && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-aqua-50 text-aqua-800">
            <span aria-label="ADA accessible">♿</span>
            <span>Accessible</span>
          </span>
        )}
      </div>

      {/* Notes */}
      {fountain.notes && (
        <p className="text-xs text-gray-400 italic leading-snug line-clamp-2">
          {fountain.notes}
        </p>
      )}

      {/* Action buttons */}
      {(onLocate || onReview) && (
        <div className="flex gap-2 mt-1">
          {onLocate && (
            <button
              type="button"
              onClick={() => onLocate(fountain)}
              className="flex-1 text-xs font-medium py-1.5 px-3 rounded-lg border border-aqua-300 text-aqua-700 hover:bg-aqua-50 transition-colors"
            >
              Show on map
            </button>
          )}
          {onReview && (
            <button
              type="button"
              onClick={() => onReview(fountain)}
              className="flex-1 text-xs font-medium py-1.5 px-3 rounded-lg bg-aqua-600 text-white hover:bg-aqua-700 transition-colors"
            >
              Leave a review
            </button>
          )}
        </div>
      )}
    </article>
  )
}
