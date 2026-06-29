// Submit — auth-gated form to propose a new fountain location.
// Writes a pending submission to Firestore via the firestore helper.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitFountain } from '../lib/firestore'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast/toastContext'
import { AUSTIN_CENTER } from '../lib/geo'
import type { FountainType } from '../types'

const TYPES: { value: FountainType; label: string }[] = [
  { value: 'fountain', label: 'Drinking fountain' },
  { value: 'bottle-filler', label: 'Bottle filler' },
  { value: 'both', label: 'Both' },
]

interface SubmitForm {
  name: string
  address: string
  lat: string
  lng: string
  type: FountainType
  accessible: boolean
  notes: string
}

export default function Submit() {
  const { currentUser, firebaseReady } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState<SubmitForm>({
    name: '',
    address: '',
    lat: '',
    lng: '',
    type: 'fountain',
    accessible: false,
    notes: '',
  })
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  const update =
    (field: keyof SubmitForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const target = e.target
      const value =
        target instanceof HTMLInputElement && target.type === 'checkbox'
          ? target.checked
          : target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const lat = Number(form.lat)
    const lng = Number(form.lng)
    if (!form.name.trim() || !form.address.trim()) {
      setError('Name and address are required.')
      return
    }
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a number between -90 and 90.')
      return
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a number between -180 and 180.')
      return
    }

    // The route is auth-gated, but guard for TS narrowing (and belt-and-braces).
    if (!currentUser) {
      setError('Please sign in to submit a fountain.')
      return
    }

    setPending(true)
    try {
      await submitFountain(
        {
          name: form.name.trim(),
          address: form.address.trim(),
          lat,
          lng,
          type: form.type,
          status: 'unverified',
          accessible: form.accessible,
          notes: form.notes.trim(),
        },
        currentUser,
      )
      setDone(true)
      toast('Submitted for review', { type: 'success' })
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit fountain.')
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold text-aqua-800 dark:text-slate-100">
          Thanks for your submission!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Your fountain has been submitted for review. Redirecting…
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-aqua-800 dark:text-slate-100">Add a Fountain</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Know a public fountain we&apos;re missing? Submit it for review.
      </p>

      {!firebaseReady && (
        <div className="mt-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Demo mode: configure Firebase in <code>.env</code> to save
          submissions.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={update('name')}
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-900 dark:text-slate-100"
            required
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium">
            Address
          </label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={update('address')}
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-900 dark:text-slate-100"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lat" className="block text-sm font-medium">
              Latitude
            </label>
            <input
              id="lat"
              type="number"
              step="any"
              placeholder={String(AUSTIN_CENTER.lat)}
              value={form.lat}
              onChange={update('lat')}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label htmlFor="lng" className="block text-sm font-medium">
              Longitude
            </label>
            <input
              id="lng"
              type="number"
              step="any"
              placeholder={String(AUSTIN_CENTER.lng)}
              value={form.lng}
              onChange={update('lng')}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-900 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            value={form.type}
            onChange={update('type')}
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-900 dark:text-slate-100"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.accessible}
            onChange={update('accessible')}
          />
          ADA accessible
        </label>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={update('notes')}
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-aqua-600 px-4 py-2 font-medium text-white hover:bg-aqua-700 disabled:opacity-50"
        >
          {pending ? 'Submitting…' : 'Submit Fountain'}
        </button>
      </form>
    </div>
  )
}
