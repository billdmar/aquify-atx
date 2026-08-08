// firebase.ts exports isFirebaseConfigured and the lazy getAuthInstance /
// getDbInstance getters. In the test environment no VITE_FIREBASE_* env vars
// are set, so isFirebaseConfigured must be false and the getters must return
// null (demo mode).

import { isFirebaseConfigured, getAuthInstance, getDbInstance } from './firebase.js'

describe('firebase — unconfigured (demo) mode', () => {
  it('isFirebaseConfigured is false when VITE_FIREBASE_* env vars are absent', () => {
    expect(isFirebaseConfigured).toBe(false)
  })

  it('getAuthInstance() returns null', () => {
    expect(getAuthInstance()).toBeNull()
  })

  it('getDbInstance() returns null', () => {
    expect(getDbInstance()).toBeNull()
  })
})
