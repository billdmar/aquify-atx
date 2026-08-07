// FountainPopup — the contents of a Leaflet marker popup for one fountain.
// Extracted from AquifyMap so the marker render stays small and the popup can
// be styled with Tailwind (react-leaflet renders children into the popup DOM,
// so utility classes apply normally) instead of a wall of inline styles.

import { Link } from 'react-router-dom'
import type { Fountain } from '../../types'
import { typeLabel, typeBadgeClass } from '../../lib/fountainTypes'
import { RatingSummary } from '../ReviewList/ratingDisplay'

/** Google Maps directions link to the fountain's coordinates. */
function directionsUrl(fountain: Fountain): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${fountain.lat},${fountain.lng}`
}

const STATUS_TEXT: Record<string, string> = {
  active: 'text-green-700',
  unverified: 'text-amber-700',
  inactive: 'text-gray-500',
}

interface FountainPopupProps {
  fountain: Fountain
  /** True when a logged-in user can leave a review. */
  canReview: boolean
  onReview?: (f: Fountain) => void
  saved?: boolean
  onToggleSave?: (f: Fountain) => void
  canSave?: boolean
  stats?: { avg: number; count: number }
}

export default function FountainPopup({
  fountain,
  canReview,
  onReview,
  saved = false,
  onToggleSave,
  canSave = false,
  stats,
}: FountainPopupProps) {
  return (
    <div className="min-w-[200px] leading-relaxed">
      <Link
        to={`/fountain/${fountain.id}`}
        className="font-bold text-aqua-900 hover:text-aqua-700 hover:underline"
      >
        {fountain.name}
      </Link>
      <p className="mt-0.5 text-[0.8rem] text-slate-500">{fountain.address}</p>

      {stats && stats.count > 0 && (
        <p className="mt-1">
          <RatingSummary rating={stats.avg} count={stats.count} />
        </p>
      )}

      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${typeBadgeClass(
          fountain.type,
        )}`}
      >
        {typeLabel(fountain.type)}
      </span>

      {fountain.accessible && (
        <p className="mt-1 text-[0.8rem]">
          <span aria-label="ADA accessible">♿</span> ADA Accessible
        </p>
      )}

      <p className="mt-1 text-[0.8rem]">
        Status:{' '}
        <span
          className={`font-semibold ${STATUS_TEXT[fountain.status] ?? 'text-gray-500'}`}
        >
          {fountain.status}
        </span>
      </p>

      {fountain.notes && (
        <p className="mt-1 text-[0.78rem] italic text-slate-500">
          {fountain.notes}
        </p>
      )}

      <div className="mt-2">
        {canReview ? (
          <button
            type="button"
            onClick={() => onReview?.(fountain)}
            className="rounded-md bg-aqua-600 px-3 py-1 text-[0.8rem] font-semibold text-white hover:bg-aqua-700"
          >
            Leave a review
          </button>
        ) : (
          <Link
            to={`/fountain/${fountain.id}`}
            className="text-[0.8rem] font-semibold text-aqua-700 hover:underline"
          >
            View details &amp; reviews →
          </Link>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <a
          href={directionsUrl(fountain)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md px-2 py-1 text-[0.8rem] font-semibold text-aqua-700 hover:bg-aqua-50"
        >
          <span aria-hidden="true">🧭</span> Get Directions
        </a>
        {canSave && onToggleSave && (
          <button
            type="button"
            onClick={() => onToggleSave(fountain)}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from saved fountains' : 'Save fountain'}
            className={`rounded-md border px-3 py-1 text-[0.8rem] font-semibold transition-colors ${
              saved
                ? 'border-aqua-600 bg-aqua-50 text-aqua-800'
                : 'border-aqua-300 text-aqua-700 hover:bg-aqua-50'
            }`}
          >
            <span aria-hidden="true">{saved ? '♥' : '♡'}</span>{' '}
            {saved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>
    </div>
  )
}
