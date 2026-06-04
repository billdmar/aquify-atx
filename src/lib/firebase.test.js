// firebase.js exports isFirebaseConfigured, app, auth, db.
// In the test environment no VITE_FIREBASE_* env vars are set, so
// isFirebaseConfigured must be false and app/auth/db must be null.

import { isFirebaseConfigured, app, auth, db } from './firebase.js'

describe('firebase — unconfigured (demo) mode', () => {
  it('isFirebaseConfigured is false when VITE_FIREBASE_* env vars are absent', () => {
    expect(isFirebaseConfigured).toBe(false)
  })

  it('app is null', () => {
    expect(app).toBeNull()
  })

  it('auth is null', () => {
    expect(auth).toBeNull()
  })

  it('db is null', () => {
    expect(db).toBeNull()
  })
})
