// Authentication helpers — thin wrappers over the Firebase v9 modular Auth
// SDK. All auth calls in the app go through here (not scattered in components).
//
// Every function throws a friendly Error if Firebase is not configured, so
// callers can surface a "Configure Firebase" message rather than a cryptic
// SDK crash.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

const NOT_CONFIGURED =
  'Firebase is not configured. Add your credentials to .env to enable accounts.'

function requireAuth() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(NOT_CONFIGURED)
  }
  return auth
}

export async function signInWithEmail(email, password) {
  const a = requireAuth()
  const cred = await signInWithEmailAndPassword(a, email, password)
  return cred.user
}

export async function registerWithEmail(email, password, displayName) {
  const a = requireAuth()
  const cred = await createUserWithEmailAndPassword(a, email, password)
  if (displayName) {
    await updateProfile(cred.user, { displayName })
  }
  return cred.user
}

export async function signInWithGoogle() {
  const a = requireAuth()
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(a, provider)
  return cred.user
}

export async function signOut() {
  const a = requireAuth()
  await fbSignOut(a)
}

/**
 * Subscribe to auth-state changes.
 * Returns an unsubscribe function. When Firebase is not configured, it
 * immediately reports "no user" and returns a no-op unsubscribe.
 *
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void}
 */
export function subscribeToAuth(callback) {
  if (!isFirebaseConfigured || !auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}
