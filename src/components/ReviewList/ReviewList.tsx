// ReviewList — renders a fountain's reviews with a star summary. Reusable on
// the fountain detail page. Presentational: receives reviews as a prop.

import type { Review } from '../../types'
import { Stars, averageRating } from './ratingDisplay'

interface ReviewListProps {
  reviews: Review[]
  loading?: boolean
}

export default function ReviewList({ reviews, loading = false }: ReviewListProps) {
  const avg = averageRating(reviews)

  if (loading) {
    return (
      <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
        Loading reviews…
      </p>
    )
  }

  return (
    <section aria-labelledby="reviews-heading">
      <div className="mb-3 flex items-center gap-3">
        <h2 id="reviews-heading" className="text-lg font-bold text-aqua-900 dark:text-slate-100">
          Reviews
        </h2>
        {avg != null ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <Stars rating={avg} />
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {avg.toFixed(1)}
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              · {reviews.length} review{reviews.length === 1 ? '' : 's'}
            </span>
          </span>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-500">No reviews yet</span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Be the first to review this fountain.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {review.authorName || 'Anonymous'}
                </span>
                <Stars
                  rating={review.rating}
                  label={`Rated ${review.rating} out of 5`}
                />
              </div>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
