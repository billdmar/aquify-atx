// FountainCard.tsx — Presentational card for a single fountain listing.

import type { Fountain } from '../../types'
import { typeLabel, typeBadgeClass, statusClass, statusDot } from '../../lib/fountainTypes'
import ShareButton from '../ShareButton/ShareButton'
import { RatingSummary } from '../ReviewList/ratingDisplay'

/** Universal cross-platform directions link (Google/Apple Maps on iOS). */
function directionsUrl(fountain: Fountain): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${fountain.lat},${fountain.lng}`
}

interface FountainCardProps {
  fountain: Fountain
  distanceMiles?: number
  onReview?: (f: Fountain) => void
  onLocate?: (f: Fountain) => void
  saved?: boolean
  onToggleSave?: (f: Fountain) => void
  stats?: { avg: number; count: number }
}

export default function FountainCard({
  fountain,
  distanceMiles,
  onReview,
  onLocate,
  saved = false,
  onToggleSave,
  stats,
}: FountainCardProps) {
  const typeBadge = typeBadgeClass(fountain.type)
  const typeText = typeLabel(fountain.type)
  const statusPill = statusClass(fountain.status)
  const statusDotClass = statusDot(fountain.status)

  return (
    <article className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm leading-snug">
          {fountain.name}
        </h3>
        {distanceMiles != null && (
          <span className="shrink-0 text-xs text-aqua-700 font-medium">
            {distanceMiles.toFixed(1)} mi
          </span>
        )}
      </div>

      {/* Address */}
      <p className="text-xs text-gray-500 dark:text-slate-400 leading-snug">{fountain.address}</p>

      {/* Rating summary */}
      {stats && stats.count > 0 && (
        <RatingSummary rating={stats.avg} count={stats.count} />
      )}

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type badge */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge}`}>
          {typeText}
        </span>

        {/* Status pill */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusPill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} aria-hidden="true" />
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
        <p className="text-xs text-gray-400 dark:text-slate-500 italic leading-snug line-clamp-2">
          {fountain.notes}
        </p>
      )}

      {/* Primary actions: locate + review */}
      {(onLocate || onReview) && (
        <div className="flex gap-2 mt-1">
          {onLocate && (
            <button
              type="button"
              onClick={() => onLocate(fountain)}
              className="flex-1 text-xs font-medium py-1.5 px-3 rounded-lg border border-aqua-300 text-aqua-700 hover:bg-aqua-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500 transition-colors"
            >
              Show on map
            </button>
          )}
          {onReview && (
            <button
              type="button"
              onClick={() => onReview(fountain)}
              className="flex-1 text-xs font-medium py-1.5 px-3 rounded-lg bg-aqua-600 text-white hover:bg-aqua-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500 focus-visible:ring-offset-1 transition-colors"
            >
              Leave a review
            </button>
          )}
        </div>
      )}

      {/* Secondary actions: directions (subtle) + save */}
      <div className="flex items-stretch gap-2">
        <a
          href={directionsUrl(fountain)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1 text-xs font-medium py-1.5 px-3 rounded-lg text-aqua-600 hover:bg-aqua-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500 transition-colors"
        >
          <span aria-hidden="true">🧭</span>
          <span>Get Directions</span>
        </a>
        <ShareButton
          title={fountain.name}
          url={`${window.location.origin}/fountain/${fountain.id}`}
          label="Share"
          className="flex-1"
        />
        {onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(fountain)}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from saved fountains' : 'Save fountain'}
            className={`flex flex-1 items-center justify-center gap-1 text-xs font-medium py-1.5 px-3 rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500 transition-colors ${
              saved
                ? 'border-aqua-600 bg-aqua-50 text-aqua-800'
                : 'border-aqua-300 text-aqua-700 hover:bg-aqua-50'
            }`}
          >
            <span
              aria-hidden="true"
              className={`text-sm leading-none transition-transform duration-150 ${saved ? 'scale-110' : 'scale-100'}`}
            >
              {saved ? '♥' : '♡'}
            </span>
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        )}
      </div>
    </article>
  )
}
