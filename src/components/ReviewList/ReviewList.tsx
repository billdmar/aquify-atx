// ReviewList — renders a fountain's reviews with a star summary. Reusable on
// the fountain detail page. Presentational: receives reviews as a prop.

import type { Review } from '../../types'

/** Inline star row for a 0–5 rating (rounds to nearest whole star). */
function Stars({ rating, label }: { rating: number; label?: string }) {
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

/** Average rating across reviews, or null when there are none. */
function averageRating(reviews: Review[]): number | null {
  if (!reviews.length) return null
  const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0)
  return total / reviews.length
}

interface ReviewListProps {
  reviews: Review[]
  loading?: boolean
}

export default function ReviewList({ reviews, loading = false }: ReviewListProps) {
  const avg = averageRating(reviews)

  if (loading) {
    return (
      <p role="status" className="text-sm text-slate-500">
        Loading reviews…
      </p>
    )
  }

  return (
    <section aria-labelledby="reviews-heading">
      <div className="mb-3 flex items-center gap-3">
        <h2 id="reviews-heading" className="text-lg font-bold text-aqua-900">
          Reviews
        </h2>
        {avg != null ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
            <Stars rating={avg} />
            <span className="font-semibold text-slate-800">
              {avg.toFixed(1)}
            </span>
            <span className="text-slate-400">
              · {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </span>
          </span>
        ) : (
          <span className="text-sm text-slate-400">No reviews yet</span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500">
          Be the first to review this fountain.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {review.authorName || 'Anonymous'}
                </span>
                <Stars
                  rating={review.rating}
                  label={`Rated ${review.rating} out of 5`}
                />
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
