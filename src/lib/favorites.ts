// favorites.js — saved-fountain data access, sibling to firestore.js.
//
// Two modes, mirroring the rest of the app:
//   • Firebase mode (configured): favorites live under
//     `users/{uid}/favorites/{fountainId}`, owner-scoped so a user only ever
//     reads/writes their own. Saving requires a signed-in user.
//   • Demo mode (Firebase not configured): favorites persist in localStorage
//     under `aquify:favorites` so the public demo is fully usable with no
//     backend and no auth.

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { getDbInstance, isFirebaseConfigured } from './firebase'
import type { AppUser } from '../types'

const NOT_CONFIGURED =
  'Firebase is not configured. Add your credentials to .env to enable this action.'

const SIGN_IN_REQUIRED = 'Sign in to save favorites.'

/** localStorage key for demo-mode favorites. */
export const DEMO_FAVORITES_KEY = 'aquify:favorites'

// ---- Demo-mode (localStorage) helpers --------------------------------------

/** Read the demo favorites array from localStorage, tolerating bad data. */
function readDemoFavorites(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(DEMO_FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Persist the demo favorites array to localStorage. */
function writeDemoFavorites(ids: string[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(DEMO_FAVORITES_KEY, JSON.stringify([...new Set(ids)]))
}

// ---- Public API ------------------------------------------------------------

/**
 * Save a fountain to the current user's favorites.
 * In Firebase mode a signed-in `user` is required; in demo mode the fountain
 * id is appended to the localStorage list (no auth needed).
 *
 * @param {string} fountainId
 * @param {{uid:string}|null} [user]
 */
export async function saveFavorite(
  fountainId: string,
  user?: AppUser | null,
): Promise<void> {
  const db = getDbInstance()
  if (!isFirebaseConfigured || !db) {
    const ids = readDemoFavorites()
    if (!ids.includes(fountainId)) ids.push(fountainId)
    writeDemoFavorites(ids)
    return
  }
  if (!user?.uid) throw new Error(SIGN_IN_REQUIRED)
  await setDoc(doc(db, 'users', user.uid, 'favorites', fountainId), {
    fountainId,
    savedAt: serverTimestamp(),
  })
}

/**
 * Remove a fountain from favorites.
 *
 * @param {string} fountainId
 * @param {{uid:string}|null} [user]
 */
export async function removeFavorite(
  fountainId: string,
  user?: AppUser | null,
): Promise<void> {
  const db = getDbInstance()
  if (!isFirebaseConfigured || !db) {
    writeDemoFavorites(readDemoFavorites().filter((id) => id !== fountainId))
    return
  }
  if (!user?.uid) throw new Error(SIGN_IN_REQUIRED)
  await deleteDoc(doc(db, 'users', user.uid, 'favorites', fountainId))
}

/**
 * One-shot fetch of the favorite fountain ids. In demo mode reads localStorage;
 * in Firebase mode requires a uid and reads the user's favorites subcollection.
 *
 * @param {string} [uid]
 * @returns {Promise<string[]>} favorite fountain ids
 */
export async function getFavorites(uid?: string): Promise<string[]> {
  const db = getDbInstance()
  if (!isFirebaseConfigured || !db) {
    return readDemoFavorites()
  }
  if (!uid) throw new Error(SIGN_IN_REQUIRED)
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'))
  return snap.docs.map((d) => d.id)
}

/**
 * Subscribe to the user's favorites. In demo mode invokes the callback once
 * with the current localStorage list and returns a no-op unsubscribe; in
 * Firebase mode streams live updates from the favorites subcollection.
 *
 * @param {string} uid
 * @param {(ids: string[]) => void} onData
 * @param {(err: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeToFavorites(
  uid: string | undefined,
  onData: (ids: string[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const db = getDbInstance()
  if (!isFirebaseConfigured || !db) {
    onData(readDemoFavorites())
    return () => {}
  }
  if (!uid) {
    if (onError) onError(new Error(SIGN_IN_REQUIRED))
    return () => {}
  }
  return onSnapshot(
    collection(db, 'users', uid, 'favorites'),
    (snap) => onData(snap.docs.map((d) => d.id)),
    (err) => {
      if (onError) onError(err)
    },
  )
}

/**
 * Convenience check: is the given fountain id in the supplied id list?
 *
 * @param {string} fountainId
 * @param {string[]} favoriteIds
 */
export function isFavorite(fountainId: string, favoriteIds: string[]): boolean {
  return Array.isArray(favoriteIds) && favoriteIds.includes(fountainId)
}

// Re-exported so callers can branch their UX (e.g. demo mode allows saving
// without auth, configured mode requires sign-in).
export { NOT_CONFIGURED }
