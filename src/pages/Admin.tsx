// Admin — moderation dashboard for community-submitted fountains.
// Lists pending submissions and lets an admin approve or reject each one,
// optimistically removing the row once the write succeeds.
//
// SECURITY: this page is reachable only via <AdminRoute>, whose isAdmin() check
// is a CLIENT-SIDE UX gate, not authorization (see src/lib/admin.ts). The real
// permission boundary is firestore.rules, which must restrict submission status
// updates to admins.

import { useEffect, useState } from 'react'
import { getPendingSubmissions, setSubmissionStatus } from '../lib/firestore'
import { useAuth } from '../context/AuthContext'
import { typeBadgeClass, typeLabel } from '../lib/fountainTypes'
import type { Submission } from '../types'

export default function Admin() {
  const { firebaseReady } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Track which row is mid-write so its buttons disable without blocking others.
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getPendingSubmissions()
      .then((rows) => {
        if (active) setSubmissions(rows)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load submissions.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    setError('')
    setBusyId(id)
    try {
      await setSubmissionStatus(id, status)
      // Optimistically drop the row now that the write succeeded.
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update submission.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-aqua-800 dark:text-slate-100">
        Moderation Queue
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Review community-submitted fountains and approve or reject each one.
      </p>

      {!firebaseReady && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
        >
          Demo mode: configure Firebase in <code>.env</code> to load and
          moderate real submissions.
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-slate-600 dark:text-slate-400">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="mt-8 text-slate-600 dark:text-slate-400">
          No pending submissions.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {submissions.map((s) => {
            const f = s.fountainData
            const busy = busyId === s.id
            return (
              <li
                key={s.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-aqua-800 dark:text-slate-100">
                        {f.name}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass(
                          f.type,
                        )}`}
                      >
                        {typeLabel(f.type)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {f.address}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                      {f.lat.toFixed(5)}, {f.lng.toFixed(5)}
                      {f.accessible ? ' · ADA accessible' : ''}
                    </p>
                    {f.notes && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {f.notes}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                      Submitted by {s.authorUid}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => moderate(s.id, 'approved')}
                      disabled={busy}
                      aria-label={`Approve ${f.name}`}
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => moderate(s.id, 'rejected')}
                      disabled={busy}
                      aria-label={`Reject ${f.name}`}
                      className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
