import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserSubmissions } from '../lib/firestore'

export default function Profile() {
  const { currentUser, firebaseReady, signOut } = useAuth()
  const navigate = useNavigate()

  const [submissions, setSubmissions] = useState([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionsError, setSubmissionsError] = useState('')
  const [signOutPending, setSignOutPending] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false

    async function fetchSubmissions() {
      setSubmissionsLoading(true)
      setSubmissionsError('')
      try {
        const data = await getUserSubmissions(currentUser.uid)
        if (!cancelled) setSubmissions(data)
      } catch (err) {
        if (!cancelled) setSubmissionsError(err.message || 'Could not load submissions.')
      } finally {
        if (!cancelled) setSubmissionsLoading(false)
      }
    }

    fetchSubmissions()
    return () => {
      cancelled = true
    }
  }, [currentUser])

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
      <div className="min-h-screen bg-aqua-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please sign in to view your profile.</p>
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
    <div className="min-h-screen bg-aqua-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-aqua-600 flex items-center justify-center text-white text-xl font-bold">
              {currentUser.displayName
                ? currentUser.displayName.charAt(0).toUpperCase()
                : currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-aqua-900">
                {currentUser.displayName || 'Aquify User'}
              </h1>
              <p className="text-sm text-slate-500">{currentUser.email}</p>
            </div>
          </div>

          {/* Info rows */}
          <dl className="space-y-3 text-sm border-t border-slate-100 pt-5">
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Display name</dt>
              <dd className="text-slate-800">{currentUser.displayName || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Email</dt>
              <dd className="text-slate-800">{currentUser.email}</dd>
            </div>
            {joinedAt && (
              <div className="flex justify-between">
                <dt className="font-medium text-slate-600">Joined</dt>
                <dd className="text-slate-800">{joinedAt}</dd>
              </div>
            )}
          </dl>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signOutPending}
            className="mt-7 w-full rounded-lg border border-red-300 bg-red-50 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {signOutPending ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>

        {/* Submissions */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-bold text-aqua-900 mb-4">Your Submissions</h2>

          {!firebaseReady && (
            <p className="text-sm text-slate-500 italic">
              Sign in with Firebase configured to see submissions.
            </p>
          )}

          {firebaseReady && submissionsLoading && (
            <p className="text-sm text-slate-500">Loading submissions…</p>
          )}

          {firebaseReady && !submissionsLoading && submissionsError && (
            <p className="text-sm text-red-600">{submissionsError}</p>
          )}

          {firebaseReady && !submissionsLoading && !submissionsError && submissions.length === 0 && (
            <p className="text-sm text-slate-500">You haven&apos;t submitted any fountains yet.</p>
          )}

          {firebaseReady && !submissionsLoading && !submissionsError && submissions.length > 0 && (
            <ul className="space-y-3">
              {submissions.map((sub) => (
                <li
                  key={sub.id}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-slate-800">
                    {sub.fountainData?.name || 'Unnamed fountain'}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        sub.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : sub.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {sub.status ?? 'pending'}
                    </span>
                    {sub.createdAt?.toDate && (
                      <span>{sub.createdAt.toDate().toLocaleDateString()}</span>
                    )}
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
