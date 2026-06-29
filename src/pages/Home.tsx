// Home — the core product page. Combines the filter bar, interactive map, and
// list view over the shared fountain data, owns the filter + geolocation state,
// and hosts the review modal.

import { useState, useMemo, useEffect, Suspense, lazy } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFountains } from '../context/FountainContext'
import { useAuth } from '../context/AuthContext'
import { haversineDistance } from '../lib/geo'
import { isFirebaseConfigured } from '../lib/firebase'
import {
  subscribeToFavorites,
  saveFavorite,
  removeFavorite,
} from '../lib/favorites'
import { useGeolocation } from '../hooks/useGeolocation'
import FilterBar from '../components/FilterBar/FilterBar'
import FountainList from '../components/FountainList/FountainList'
import ReviewModal from '../components/ReviewModal/ReviewModal'
import type { Fountain, FilterState, FountainType, FountainView } from '../types'

// Leaflet is heavy and not SSR-safe — load it lazily.
const AquifyMap = lazy(() => import('../components/Map/AquifyMap'))

const ALL_TYPES: FountainType[] = ['fountain', 'bottle-filler', 'both']

const initialFilters: FilterState = {
  search: '',
  types: new Set(ALL_TYPES),
  activeOnly: false,
  accessibleOnly: false,
  radiusMiles: null,
}

export default function Home() {
  const { fountains, loading, error } = useFountains()
  const { currentUser } = useAuth()
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  // Geolocation ("Near me") — the hook surfaces a status note so the button
  // never fails silently when the API is missing or permission is denied.
  const {
    location: userLocation,
    locating,
    note: locationNote,
    request: requestLocation,
  } = useGeolocation()
  // 'map' is the default; the user can switch to 'list'. Deriving the active
  // view from a single state value (rather than syncing in an effect) avoids a
  // setState-in-effect cascade. The ?focus=<id> param simply feeds the map.
  const [view, setView] = useState<FountainView>('map')
  const [reviewTarget, setReviewTarget] = useState<Fountain | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [searchParams, setSearchParams] = useSearchParams()

  // ?focus=<id> (e.g. from the hydration page) centers the map on a fountain.
  const focusId = searchParams.get('focus')

  // In demo mode favorites live in localStorage (no auth needed); when Firebase
  // is configured we stream the signed-in user's favorites and require login to
  // save (matching the review-gating pattern).
  const canSave = !isFirebaseConfigured || Boolean(currentUser)

  useEffect(() => {
    // In demo mode subscribeToFavorites reads localStorage regardless of uid;
    // in Firebase mode a missing uid (logged out) reports an empty list via the
    // error callback, so a single subscription handles both states.
    const unsubscribe = subscribeToFavorites(
      currentUser?.uid,
      setFavoriteIds,
      () => setFavoriteIds([]),
    )
    return unsubscribe
  }, [currentUser])

  const handleToggleSave = async (fountain: Fountain) => {
    const isSaved = favoriteIds.includes(fountain.id)
    // Optimistic update; in demo mode the subscription is a one-shot read so
    // this also keeps the UI in sync without a refetch.
    setFavoriteIds((ids) =>
      isSaved ? ids.filter((id) => id !== fountain.id) : [...ids, fountain.id],
    )
    try {
      if (isSaved) {
        await removeFavorite(fountain.id, currentUser)
      } else {
        await saveFavorite(fountain.id, currentUser)
      }
    } catch {
      // Roll back on failure (e.g. not signed in with Firebase configured).
      setFavoriteIds((ids) =>
        isSaved ? [...ids, fountain.id] : ids.filter((id) => id !== fountain.id),
      )
    }
  }

  const handleLocate = (fountain: Fountain) => {
    setView('map')
    setSearchParams({ focus: fountain.id })
  }

  const filtered = useMemo(() => {
    const typeSet =
      filters.types instanceof Set ? filters.types : new Set(filters.types)
    const term = filters.search.trim().toLowerCase()

    return fountains.filter((f) => {
      if (typeSet.size && !typeSet.has(f.type)) return false
      if (filters.activeOnly && f.status !== 'active') return false
      if (filters.accessibleOnly && !f.accessible) return false
      if (term) {
        const haystack = `${f.name} ${f.address}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (
        filters.radiusMiles != null &&
        userLocation &&
        haversineDistance(userLocation.lat, userLocation.lng, f.lat, f.lng) >
          filters.radiusMiles
      ) {
        return false
      }
      return true
    })
  }, [fountains, filters, userLocation])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {!isFirebaseConfigured && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Demo mode.</strong> Showing {fountains.length} fountains from
          local seed data. Add Firebase credentials to <code>.env</code> to
          enable accounts, submissions, and reviews.
        </div>
      )}

      {locationNote && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800"
        >
          {locationNote}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-aqua-800">
          Austin Water Fountains
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={requestLocation}
            disabled={locating}
            aria-busy={locating}
            className="rounded-md bg-aqua-600 px-3 py-2 text-sm font-medium text-white hover:bg-aqua-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locating ? 'Locating…' : '📍 Near me'}
          </button>
          <div className="inline-flex overflow-hidden rounded-md border border-aqua-300">
            <button
              type="button"
              onClick={() => setView('map')}
              className={`px-3 py-2 text-sm font-medium ${
                view === 'map'
                  ? 'bg-aqua-600 text-white'
                  : 'bg-white text-aqua-700'
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm font-medium ${
                view === 'list'
                  ? 'bg-aqua-600 text-white'
                  : 'bg-white text-aqua-700'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
        <aside>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            locationKnown={Boolean(userLocation)}
          />
          <p className="mt-2 text-sm text-slate-500">
            Showing {filtered.length} of {fountains.length} fountains
          </p>
        </aside>

        <section className="min-h-[60vh]">
          {loading && (
            <div className="flex h-[60vh] items-center justify-center text-aqua-700">
              Loading fountains…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800">
              Failed to load fountains: {error.message}
            </div>
          )}
          {!loading && !error && view === 'map' && (
            <div className="h-[60vh] overflow-hidden rounded-lg border border-aqua-200 shadow-sm md:h-[70vh]">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-aqua-700">
                    Loading map…
                  </div>
                }
              >
                <AquifyMap
                  fountains={filtered}
                  userLocation={userLocation}
                  focusId={focusId}
                  onReview={setReviewTarget}
                  favoriteIds={favoriteIds}
                  onToggleSave={handleToggleSave}
                  canSave={canSave}
                />
              </Suspense>
            </div>
          )}
          {!loading && !error && view === 'list' && (
            <FountainList
              fountains={filtered}
              userLocation={userLocation}
              onReview={currentUser ? setReviewTarget : undefined}
              onLocate={handleLocate}
              favoriteIds={favoriteIds}
              onToggleSave={canSave ? handleToggleSave : undefined}
            />
          )}
        </section>
      </div>

      {reviewTarget && (
        <ReviewModal
          fountain={reviewTarget}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  )
}
