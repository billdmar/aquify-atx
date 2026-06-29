// FountainDetail — shareable page for a single fountain at /fountain/:id.
// Shows full details, a directions link, a save toggle, the review CTA, and
// the visible review list (reviews are otherwise write-only in the app).

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFountains } from '../context/FountainContext'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'
import { getReviewsForFountain } from '../lib/firestore'
import {
  saveFavorite,
  removeFavorite,
  subscribeToFavorites,
} from '../lib/favorites'
import { typeLabel, typeBadgeClass, statusClass } from '../lib/fountainTypes'
import ReviewList from '../components/ReviewList/ReviewList'
import ReviewModal from '../components/ReviewModal/ReviewModal'
import type { Fountain, Review } from '../types'

function directionsUrl(f: Fountain): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`
}

export default function FountainDetail() {
  const { id } = useParams<{ id: string }>()
  const { fountains, loading: fountainsLoading } = useFountains()
  const { currentUser } = useAuth()

  const fountain = fountains.find((f) => f.id === id)

  const [reviews, setReviews] = useState<Review[]>([])
  // Start in the loading state only when there's a backend to load from.
  const [reviewsLoading, setReviewsLoading] = useState(isFirebaseConfigured)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)

  const canSave = !isFirebaseConfigured || Boolean(currentUser)
  const saved = id != null && favoriteIds.includes(id)

  // Stream favorites (localStorage in demo mode, Firestore when configured).
  useEffect(() => {
    const unsubscribe = subscribeToFavorites(
      currentUser?.uid,
      setFavoriteIds,
      () => setFavoriteIds([]),
    )
    return unsubscribe
  }, [currentUser])

  // Load reviews when configured; demo mode has no backend so the list is empty.
  useEffect(() => {
    if (!id || !isFirebaseConfigured) return
    let active = true
    getReviewsForFountain(id, 50)
      .then((data) => {
        if (active) setReviews(data)
      })
      .catch(() => {
        if (active) setReviews([])
      })
      .finally(() => {
        if (active) setReviewsLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, reviewOpen])

  const handleToggleSave = async () => {
    if (!fountain) return
    const wasSaved = saved
    setFavoriteIds((ids) =>
      wasSaved ? ids.filter((x) => x !== fountain.id) : [...ids, fountain.id],
    )
    try {
      if (wasSaved) await removeFavorite(fountain.id, currentUser)
      else await saveFavorite(fountain.id, currentUser)
    } catch {
      setFavoriteIds((ids) =>
        wasSaved ? [...ids, fountain.id] : ids.filter((x) => x !== fountain.id),
      )
    }
  }

  if (fountainsLoading) {
    return (
      <div
        role="status"
        className="flex min-h-[50vh] items-center justify-center text-aqua-700"
      >
        Loading…
      </div>
    )
  }

  if (!fountain) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600 dark:text-slate-400">
        <h1 className="text-2xl font-bold text-aqua-800 dark:text-slate-100">Fountain not found</h1>
        <p className="mt-2">
          We couldn&apos;t find that fountain.{' '}
          <Link to="/" className="font-medium text-aqua-700 underline">
            Back to the map
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to="/"
        className="text-sm font-medium text-aqua-700 hover:underline"
      >
        ← Back to map
      </Link>

      <header className="mt-3">
        <h1 className="text-2xl font-bold text-aqua-900 dark:text-slate-100">{fountain.name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{fountain.address}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadgeClass(
              fountain.type,
            )}`}
          >
            {typeLabel(fountain.type)}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(
              fountain.status,
            )}`}
          >
            {fountain.status}
          </span>
          {fountain.accessible && (
            <span className="rounded-full bg-aqua-50 px-2.5 py-0.5 text-xs font-semibold text-aqua-800">
              ♿ ADA Accessible
            </span>
          )}
        </div>
      </header>

      {fountain.notes && (
        <p className="mt-4 text-sm italic text-slate-500 dark:text-slate-400">{fountain.notes}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={directionsUrl(fountain)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-aqua-600 px-4 py-2 text-sm font-semibold text-white hover:bg-aqua-700"
        >
          🧭 Get Directions
        </a>
        {canSave && (
          <button
            type="button"
            onClick={handleToggleSave}
            aria-pressed={saved}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              saved
                ? 'border-aqua-600 bg-aqua-50 text-aqua-800'
                : 'border-aqua-300 text-aqua-700 hover:bg-aqua-50'
            }`}
          >
            {saved ? '♥ Saved' : '♡ Save'}
          </button>
        )}
        {currentUser && (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="rounded-lg border border-aqua-300 px-4 py-2 text-sm font-semibold text-aqua-700 hover:bg-aqua-50"
          >
            Leave a review
          </button>
        )}
      </div>

      {!isFirebaseConfigured && (
        <p className="mt-6 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Demo mode — reviews are stored once Firebase is configured.
        </p>
      )}

      <hr className="my-6 border-slate-100 dark:border-slate-700" />

      <ReviewList reviews={reviews} loading={reviewsLoading} />

      {reviewOpen && (
        <ReviewModal fountain={fountain} onClose={() => setReviewOpen(false)} />
      )}
    </div>
  )
}
