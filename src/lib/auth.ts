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
  type Auth,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

const NOT_CONFIGURED =
  'Firebase is not configured. Add your credentials to .env to enable accounts.'

function requireAuth(): Auth {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(NOT_CONFIGURED)
  }
  return auth
}

/**
 * Translate a raw Firebase Auth error into a friendly, user-facing message.
 * Falls back to a generic message for unknown codes so we never surface a
 * cryptic SDK string in the UI.
 */
export function mapAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.'
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 6 characters).'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Something went wrong. Please try again.'
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const a = requireAuth()
  const cred = await signInWithEmailAndPassword(a, email, password)
  return cred.user
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<User> {
  const a = requireAuth()
  const cred = await createUserWithEmailAndPassword(a, email, password)
  if (displayName) {
    await updateProfile(cred.user, { displayName })
  }
  return cred.user
}

export async function signInWithGoogle(): Promise<User> {
  const a = requireAuth()
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(a, provider)
  return cred.user
}

export async function signOut(): Promise<void> {
  const a = requireAuth()
  await fbSignOut(a)
}

/**
 * Subscribe to auth-state changes.
 * Returns an unsubscribe function. When Firebase is not configured, it
 * immediately reports "no user" and returns a no-op unsubscribe.
 */
export function subscribeToAuth(
  callback: (user: User | null) => void,
): () => void {
  if (!isFirebaseConfigured || !auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}
