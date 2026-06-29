// useGeolocation — wraps the browser Geolocation API into a small, testable
// hook. Centralizes the "Near me" logic that was duplicated in Home and
// Recommend: pending state, a user-facing status note, and a typed lat/lng.

import { useCallback, useState } from 'react'
import type { LatLng } from '../types'

interface UseGeolocationResult {
  location: LatLng | null
  locating: boolean
  /** Human-readable status note (e.g. permission denied), or null. */
  note: string | null
  /** Request the user's current position. */
  request: () => void
  /** Clear the current location and note. */
  clear: () => void
}

const DEFAULT_TIMEOUT_MS = 8000

export function useGeolocation(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): UseGeolocationResult {
  const [location, setLocation] = useState<LatLng | null>(null)
  const [locating, setLocating] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const request = useCallback(() => {
    if (!('geolocation' in navigator) || !navigator.geolocation) {
      setNote('Location is not supported by this browser.')
      return
    }
    setLocating(true)
    setNote(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocation(null)
        setLocating(false)
        setNote(
          'Location access is off — enable it to sort and filter by distance.',
        )
      },
      { timeout: timeoutMs },
    )
  }, [timeoutMs])

  const clear = useCallback(() => {
    setLocation(null)
    setNote(null)
  }, [])

  return { location, locating, note, request, clear }
}
