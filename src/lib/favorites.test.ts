// favorites.js — tests for the demo-mode / localStorage path.
// Firebase is NOT configured in the test environment, so every helper takes the
// localStorage branch and no sign-in is required.

import { beforeEach, describe, it, expect, vi } from 'vitest'
import {
  DEMO_FAVORITES_KEY,
  saveFavorite,
  removeFavorite,
  getFavorites,
  subscribeToFavorites,
  isFavorite,
} from './favorites.js'

beforeEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// saveFavorite / getFavorites
// ---------------------------------------------------------------------------
describe('saveFavorite (demo mode)', () => {
  it('persists a fountain id to localStorage', async () => {
    await saveFavorite('f1')
    expect(await getFavorites()).toEqual(['f1'])
    expect(JSON.parse(localStorage.getItem(DEMO_FAVORITES_KEY) ?? '')).toEqual(['f1'])
  })

  it('does not duplicate an already-saved id', async () => {
    await saveFavorite('f1')
    await saveFavorite('f1')
    expect(await getFavorites()).toEqual(['f1'])
  })

  it('accumulates multiple distinct ids', async () => {
    await saveFavorite('f1')
    await saveFavorite('f2')
    expect(await getFavorites()).toEqual(['f1', 'f2'])
  })

  it('works without a user argument (no auth in demo mode)', async () => {
    await expect(saveFavorite('f1')).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// removeFavorite
// ---------------------------------------------------------------------------
describe('removeFavorite (demo mode)', () => {
  it('removes a saved id', async () => {
    await saveFavorite('f1')
    await saveFavorite('f2')
    await removeFavorite('f1')
    expect(await getFavorites()).toEqual(['f2'])
  })

  it('is a no-op when the id is not saved', async () => {
    await saveFavorite('f1')
    await removeFavorite('does-not-exist')
    expect(await getFavorites()).toEqual(['f1'])
  })
})

// ---------------------------------------------------------------------------
// getFavorites — resilience
// ---------------------------------------------------------------------------
describe('getFavorites (demo mode)', () => {
  it('returns an empty array when nothing is stored', async () => {
    expect(await getFavorites()).toEqual([])
  })

  it('returns an empty array on corrupt JSON', async () => {
    localStorage.setItem(DEMO_FAVORITES_KEY, 'not-json{')
    expect(await getFavorites()).toEqual([])
  })

  it('filters out non-string entries', async () => {
    localStorage.setItem(DEMO_FAVORITES_KEY, JSON.stringify(['f1', 42, null, 'f2']))
    expect(await getFavorites()).toEqual(['f1', 'f2'])
  })
})

// ---------------------------------------------------------------------------
// subscribeToFavorites — demo mode
// ---------------------------------------------------------------------------
describe('subscribeToFavorites (demo mode)', () => {
  it('calls onData synchronously with the stored ids', async () => {
    await saveFavorite('f1')
    const onData = vi.fn()
    subscribeToFavorites('any-uid', onData)
    expect(onData).toHaveBeenCalledTimes(1)
    expect(onData.mock.calls[0][0]).toEqual(['f1'])
  })

  it('returns a no-op unsubscribe that does not throw', () => {
    const unsub = subscribeToFavorites('any-uid', vi.fn())
    expect(typeof unsub).toBe('function')
    expect(() => unsub()).not.toThrow()
  })

  it('does not call onError in demo mode', () => {
    const onError = vi.fn()
    subscribeToFavorites('any-uid', vi.fn(), onError)
    expect(onError).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Full save → isFavorite → remove → isFavorite round-trip (demo mode), the
// exact lifecycle the FountainCard / map-popup Save toggle drives.
// ---------------------------------------------------------------------------
describe('demo-mode favorite lifecycle (round-trip)', () => {
  it('save then isFavorite(getFavorites) is true, remove then false', async () => {
    expect(isFavorite('f1', await getFavorites())).toBe(false)

    await saveFavorite('f1')
    expect(isFavorite('f1', await getFavorites())).toBe(true)

    await removeFavorite('f1')
    expect(isFavorite('f1', await getFavorites())).toBe(false)
    expect(await getFavorites()).toEqual([])
  })

  it('removing one of several leaves the others toggled on', async () => {
    await saveFavorite('f1')
    await saveFavorite('f2')
    await saveFavorite('f3')
    await removeFavorite('f2')

    const ids = await getFavorites()
    expect(isFavorite('f1', ids)).toBe(true)
    expect(isFavorite('f2', ids)).toBe(false)
    expect(isFavorite('f3', ids)).toBe(true)
  })

  it('tolerates a non-array (object) blob in localStorage by treating it as empty', async () => {
    localStorage.setItem(DEMO_FAVORITES_KEY, JSON.stringify({ not: 'an array' }))
    expect(await getFavorites()).toEqual([])
    // and a save on top of corrupt data recovers cleanly
    await saveFavorite('f1')
    expect(await getFavorites()).toEqual(['f1'])
  })

  it('de-duplicates pre-existing duplicate ids on the next write', async () => {
    localStorage.setItem(DEMO_FAVORITES_KEY, JSON.stringify(['f1', 'f1', 'f2']))
    await saveFavorite('f3') // triggers a write, which Set-dedupes
    expect(await getFavorites()).toEqual(['f1', 'f2', 'f3'])
  })
})

// ---------------------------------------------------------------------------
// isFavorite
// ---------------------------------------------------------------------------
describe('isFavorite', () => {
  it('returns true when the id is present', () => {
    expect(isFavorite('f1', ['f1', 'f2'])).toBe(true)
  })

  it('returns false when the id is absent', () => {
    expect(isFavorite('f3', ['f1', 'f2'])).toBe(false)
  })

  it('returns false for a non-array input', () => {
    // @ts-expect-error — deliberately passing undefined to verify the Array.isArray guard
    expect(isFavorite('f1', undefined)).toBe(false)
  })
})
