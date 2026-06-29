// ratingDisplay — shared review-rating presentation: the average-rating math,
// the inline star row, and a compact "★ 4.5 · 12" summary used on cards and
// map popups. Extracted from ReviewList so cards/popups can reuse it without
// pulling in the whole list component.

import type { Review } from '../../types'

// This module intentionally co-locates the rating math with its presentational
// star/summary components so cards and popups import from one place; fast
// refresh of these tiny pure components is not a concern.
// eslint-disable-next-line react-refresh/only-export-components
export function averageRating(reviews: Review[]): number | null {
  if (!reviews.length) return null
  const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0)
  return total / reviews.length
}

/** Inline star row for a 0–5 rating (rounds to nearest whole star). */
export function Stars({ rating, label }: { rating: number; label?: string }) {
  const rounded = Math.round(rating)
  return (
    <span
      className="inline-flex items-center"
      role="img"
      aria-label={label ?? `${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={rounded >= s ? '#F59E0B' : 'none'}
          stroke={rounded >= s ? '#F59E0B' : '#94A3B8'}
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.5a.56.56 0 0 1 1.04 0l2.12 5.11a.56.56 0 0 0 .48.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 0 0-.18.56l1.28 5.38a.56.56 0 0 1-.84.61l-4.72-2.88a.56.56 0 0 0-.59 0l-4.72 2.88a.56.56 0 0 1-.84-.61l1.28-5.38a.56.56 0 0 0-.18-.56l-4.2-3.6a.56.56 0 0 1 .32-.99l5.52-.44a.56.56 0 0 0 .48-.35L11.48 3.5z"
          />
        </svg>
      ))}
    </span>
  )
}

interface RatingSummaryProps {
  rating: number
  count: number
}

/** Compact "★ 4.5 · 12" rating summary for cards and map popups. */
export function RatingSummary({ rating, count }: RatingSummaryProps) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400"
      aria-label={`${rating.toFixed(1)} out of 5 stars from ${count} review${count === 1 ? '' : 's'}`}
    >
      <span aria-hidden="true" className="text-amber-500">
        ★
      </span>
      <span className="font-semibold text-slate-800 dark:text-slate-100">
        {rating.toFixed(1)}
      </span>
      <span className="text-slate-400 dark:text-slate-500" aria-hidden="true">
        · {count}
      </span>
    </span>
  )
}
