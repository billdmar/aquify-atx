// firestore.js — tests for the demo-mode / fallback path.
// Firebase is NOT configured in the test environment (no VITE_FIREBASE_* env
// vars), so isFirebaseConfigured is false and every write helper throws via
// requireDb(), while reads fall back to the local seed data.

import {
  getLocalFountains,
  subscribeToFountains,
  submitFountain,
  addReview,
  upvoteReview,
  deleteReview,
  getUserSubmissions,
  ensureUserProfile,
  getReviewsForFountain,
} from './firestore.js'

const EXPECTED_LENGTH = 33

// ---------------------------------------------------------------------------
// getLocalFountains
// ---------------------------------------------------------------------------
describe('getLocalFountains', () => {
  it('returns an array with exactly 33 entries', () => {
    const fountains = getLocalFountains()
    expect(Array.isArray(fountains)).toBe(true)
    expect(fountains.length).toBe(EXPECTED_LENGTH)
  })

  it('every entry has id, name, lat, lng, type, and status', () => {
    const fountains = getLocalFountains()
    for (const f of fountains) {
      expect(f).toHaveProperty('id')
      expect(f).toHaveProperty('name')
      expect(f).toHaveProperty('lat')
      expect(f).toHaveProperty('lng')
      expect(f).toHaveProperty('type')
      expect(f).toHaveProperty('status')
    }
  })

  it('every lat/lng is numeric', () => {
    const fountains = getLocalFountains()
    for (const f of fountains) {
      expect(typeof f.lat).toBe('number')
      expect(typeof f.lng).toBe('number')
    }
  })
})

// ---------------------------------------------------------------------------
// subscribeToFountains — demo mode
// ---------------------------------------------------------------------------
describe('subscribeToFountains (demo mode)', () => {
  it('calls onData synchronously with an array of length 33', () => {
    const onData = vi.fn()
    subscribeToFountains(onData)
    expect(onData).toHaveBeenCalledTimes(1)
    const [arg] = onData.mock.calls[0]
    expect(Array.isArray(arg)).toBe(true)
    expect(arg.length).toBe(EXPECTED_LENGTH)
  })

  it('returns a function (the no-op unsubscribe)', () => {
    const unsub = subscribeToFountains(vi.fn())
    expect(typeof unsub).toBe('function')
  })

  it('the unsubscribe function does not throw when called', () => {
    const unsub = subscribeToFountains(vi.fn())
    expect(() => unsub()).not.toThrow()
  })

  it('does not call onError in demo mode', () => {
    const onError = vi.fn()
    subscribeToFountains(vi.fn(), onError)
    expect(onError).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Write helpers — all reject with "not configured" in demo mode
// ---------------------------------------------------------------------------
const NOT_CONFIGURED_RE = /not configured/i

describe('submitFountain (demo mode — throws)', () => {
  it('rejects with a "not configured" error', async () => {
    await expect(
      // @ts-expect-error — partial fountain data is fine: demo mode rejects before validating the payload
      submitFountain({ name: 'Test' }, { uid: 'u1', email: 'a@b.com' })
    ).rejects.toThrow(NOT_CONFIGURED_RE)
  })
})

describe('addReview (demo mode — throws)', () => {
  it('rejects with a "not configured" error', async () => {
    await expect(
      addReview('fountain-1', { rating: 5, comment: 'Great' }, { uid: 'u1', displayName: 'Alice', email: 'a@b.com' })
    ).rejects.toThrow(NOT_CONFIGURED_RE)
  })
})

describe('upvoteReview (demo mode — throws)', () => {
  it('rejects with a "not configured" error', async () => {
    await expect(upvoteReview('review-1')).rejects.toThrow(NOT_CONFIGURED_RE)
  })
})

describe('deleteReview (demo mode — throws)', () => {
  it('rejects with a "not configured" error', async () => {
    await expect(deleteReview('review-1')).rejects.toThrow(NOT_CONFIGURED_RE)
  })
})

describe('getUserSubmissions (demo mode — throws)', () => {
  it('rejects with a "not configured" error', async () => {
    await expect(getUserSubmissions('uid-1')).rejects.toThrow(NOT_CONFIGURED_RE)
  })
})

describe('ensureUserProfile (demo mode — throws)', () => {
  it('rejects with a "not configured" error', async () => {
    await expect(
      ensureUserProfile({ uid: 'u1', email: 'a@b.com', displayName: 'Alice' })
    ).rejects.toThrow(NOT_CONFIGURED_RE)
  })
})

describe('getReviewsForFountain (demo mode — throws)', () => {
  it('rejects with a "not configured" error', async () => {
    await expect(getReviewsForFountain('fountain-1')).rejects.toThrow(NOT_CONFIGURED_RE)
  })
})
