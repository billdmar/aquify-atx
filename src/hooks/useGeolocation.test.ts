import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGeolocation } from './useGeolocation.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useGeolocation', () => {
  it('sets location and clears locating on a successful request', () => {
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation(
      (success) => {
        success({
          coords: { latitude: 30.1, longitude: -97.1 },
        } as GeolocationPosition)
      },
    )

    const { result } = renderHook(() => useGeolocation())
    expect(result.current.location).toBeNull()

    act(() => {
      result.current.request()
    })

    expect(result.current.location).toEqual({ lat: 30.1, lng: -97.1 })
    expect(result.current.locating).toBe(false)
    expect(result.current.note).toBeNull()
  })

  it('leaves location null and sets a note when permission is denied', () => {
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation(
      (_success, error) => {
        error?.({
          code: 1,
          message: 'User denied Geolocation',
        } as GeolocationPositionError)
      },
    )

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.request()
    })

    expect(result.current.location).toBeNull()
    expect(result.current.locating).toBe(false)
    expect(result.current.note).toBe(
      'Location access is off — enable it to sort and filter by distance.',
    )
  })

  it('sets an unsupported note when the browser lacks geolocation', () => {
    const original = navigator.geolocation
    // Make the `!navigator.geolocation` guard fail by removing the API.
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    })

    try {
      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.request()
      })

      expect(result.current.location).toBeNull()
      expect(result.current.locating).toBe(false)
      expect(result.current.note).toBe(
        'Location is not supported by this browser.',
      )
    } finally {
      Object.defineProperty(navigator, 'geolocation', {
        value: original,
        configurable: true,
      })
    }
  })

  it('clear() resets location and note after a successful request', () => {
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation(
      (success) => {
        success({
          coords: { latitude: 30.1, longitude: -97.1 },
        } as GeolocationPosition)
      },
    )

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.request()
    })
    expect(result.current.location).not.toBeNull()

    act(() => {
      result.current.clear()
    })

    expect(result.current.location).toBeNull()
    expect(result.current.note).toBeNull()
  })
})
