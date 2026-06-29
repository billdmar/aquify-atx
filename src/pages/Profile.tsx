import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFountains } from '../context/FountainContext'
import { getUserSubmissions } from '../lib/firestore'
import { subscribeToFavorites, removeFavorite } from '../lib/favorites'
import type { Fountain, Submission } from '../types'

/** Narrow a Firestore-style timestamp (`{ toDate(): Date }`) from `unknown`. */
function asTimestamp(value: unknown): { toDate: () => Date } | null {
  return value &&
    typeof value === 'object' &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
    ? (value as { toDate: () => Date })
    : null
}

export default function Profile() {
  const { currentUser, firebaseReady, signOut } = useAuth()
  const { fountains } = useFountains()
  const navigate = useNavigate()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsError, setSubmissionsError] = useState('')
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [signOutPending, setSignOutPending] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const uid = currentUser.uid
    let cancelled = false

    async function fetchSubmissions() {
      setSubmissionsLoading(true)
      setSubmissionsError('')
      try {
        const data = await getUserSubmissions(uid)
        if (!cancelled) setSubmissions(data)
      } catch (err) {
        if (!cancelled)
          setSubmissionsError(
            (err instanceof Error && err.message) || 'Could not load submissions.',
          )
      } finally {
        if (!cancelled) setSubmissionsLoading(false)
      }
    }

    fetchSubmissions()
    return () => {
      cancelled = true
    }
  }, [currentUser])

  // Stream the user's saved fountains (Firebase mode) or read localStorage
  // (demo mode), mirroring the favorites helper's graceful degradation.
  useEffect(() => {
    if (!currentUser) return undefined
    const unsubscribe = subscribeToFavorites(
      currentUser.uid,
      setFavoriteIds,
      () => setFavoriteIds([]),
    )
    return unsubscribe
  }, [currentUser])

  const savedFountains = favoriteIds
    .map((id) => fountains.find((f) => f.id === id))
    .filter((f): f is Fountain => Boolean(f))

  async function handleUnsave(fountainId: string) {
    setFavoriteIds((ids) => ids.filter((id) => id !== fountainId))
    try {
      await removeFavorite(fountainId, currentUser)
    } catch {
      setFavoriteIds((ids) => [...ids, fountainId])
    }
  }

  async function handleSignOut() {
    setSignOutPending(true)
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      // signOut should rarely throw; surface nothing critical
      console.error(err)
    } finally {
      setSignOutPending(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-aqua-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Please sign in to view your profile.</p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-aqua-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-aqua-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Derive join date from Firebase's metadata if available
  const joinedAt = currentUser.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="min-h-screen bg-aqua-50 dark:bg-slate-900 px-4 py-10">
      <div className="mx-auto max-w-xl">
        {/* Profile card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-aqua-600 flex items-center justify-center text-white text-xl font-bold">
              {currentUser.displayName
                ? currentUser.displayName.charAt(0).toUpperCase()
                : currentUser.email!.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-aqua-900 dark:text-slate-100">
                {currentUser.displayName || 'Aquify User'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
            </div>
          </div>

          {/* Info rows */}
          <dl className="space-y-3 text-sm border-t border-slate-100 dark:border-slate-700 pt-5">
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600 dark:text-slate-400">Display name</dt>
              <dd className="text-slate-800 dark:text-slate-100">{currentUser.displayName || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600 dark:text-slate-400">Email</dt>
              <dd className="text-slate-800 dark:text-slate-100">{currentUser.email}</dd>
            </div>
            {joinedAt && (
              <div className="flex justify-between">
                <dt className="font-medium text-slate-600 dark:text-slate-400">Joined</dt>
                <dd className="text-slate-800 dark:text-slate-100">{joinedAt}</dd>
              </div>
            )}
          </dl>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signOutPending}
            className="mt-7 w-full rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 py-2.5 text-sm font-semibold text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {signOutPending ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>

        {/* Submissions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-bold text-aqua-900 dark:text-slate-100 mb-4">Your Submissions</h2>

          {!firebaseReady && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              Sign in with Firebase configured to see submissions.
            </p>
          )}

          {firebaseReady && submissionsLoading && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading submissions…</p>
          )}

          {firebaseReady && !submissionsLoading && submissionsError && (
            <p className="text-sm text-red-600">{submissionsError}</p>
          )}

          {firebaseReady && !submissionsLoading && !submissionsError && submissions.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">You haven&apos;t submitted any fountains yet.</p>
          )}

          {firebaseReady && !submissionsLoading && !submissionsError && submissions.length > 0 && (
            <ul className="space-y-3">
              {submissions.map((sub) => (
                <li
                  key={sub.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {sub.fountainData?.name || 'Unnamed fountain'}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        sub.status === 'approved'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200'
                          : sub.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200'
                      }`}
                    >
                      {sub.status ?? 'pending'}
                    </span>
                    {asTimestamp(sub.createdAt) && (
                      <span>{asTimestamp(sub.createdAt)!.toDate().toLocaleDateString()}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Saved fountains */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mt-6">
          <h2 className="text-lg font-bold text-aqua-900 dark:text-slate-100 mb-4">Saved Fountains</h2>

          {savedFountains.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You haven&apos;t saved any fountains yet. Tap the heart on a fountain
              to add it here.
            </p>
          ) : (
            <ul className="space-y-3">
              {savedFountains.map((fountain) => (
                <li
                  key={fountain.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{fountain.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {fountain.address}
                      </p>
                      <span className="mt-1.5 inline-flex rounded-full bg-aqua-50 dark:bg-slate-700/40 px-2 py-0.5 text-xs font-medium capitalize text-aqua-700 dark:text-aqua-200">
                        {fountain.type}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Link
                        to={`/?focus=${fountain.id}`}
                        className="rounded px-1 py-0.5 text-xs font-medium text-aqua-700 hover:text-aqua-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500"
                      >
                        Show on map
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleUnsave(fountain.id)}
                        aria-label={`Remove ${fountain.name} from saved fountains`}
                        className="rounded px-1 py-0.5 text-xs font-medium text-red-600 hover:text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        Unsave
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
