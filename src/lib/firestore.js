// Firestore data access — all CRUD lives here, never inline in components.
//
// Graceful degradation: when Firebase is not configured, reads fall back to
// the committed local seed data (src/data/fountains.json) so the map and list
// still work in demo mode, and writes throw a friendly "configure Firebase"
// error.

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  setDoc,
  increment,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import localFountains from '../data/fountains.json'

const NOT_CONFIGURED =
  'Firebase is not configured. Add your credentials to .env to enable this action.'

function requireDb() {
  if (!isFirebaseConfigured || !db) throw new Error(NOT_CONFIGURED)
  return db
}

// ---- Fountains -------------------------------------------------------------

/** Local seed data, used as the demo-mode fallback. */
export function getLocalFountains() {
  return localFountains
}

/**
 * Subscribe to the fountains collection. In demo mode (no Firebase), invokes
 * the callback once with local seed data and returns a no-op unsubscribe.
 *
 * @param {(fountains: object[]) => void} onData
 * @param {(err: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeToFountains(onData, onError) {
  if (!isFirebaseConfigured || !db) {
    onData(localFountains)
    return () => {}
  }
  const q = query(collection(db, 'fountains'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      if (onError) onError(err)
    },
  )
}

// ---- Submissions -----------------------------------------------------------

export async function submitFountain(fountainData, user) {
  const database = requireDb()
  return addDoc(collection(database, 'submissions'), {
    fountainData,
    authorUid: user.uid,
    authorEmail: user.email,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function getUserSubmissions(uid) {
  const database = requireDb()
  const q = query(
    collection(database, 'submissions'),
    where('authorUid', '==', uid),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ---- Reviews ---------------------------------------------------------------

export async function addReview(fountainId, { rating, comment }, user) {
  const database = requireDb()
  return addDoc(collection(database, 'reviews'), {
    fountainId,
    authorUid: user.uid,
    authorName: user.displayName || user.email,
    rating,
    comment,
    upvotes: 0,
    createdAt: serverTimestamp(),
  })
}

export async function getReviewsForFountain(fountainId, max = 10) {
  const database = requireDb()
  const q = query(
    collection(database, 'reviews'),
    where('fountainId', '==', fountainId),
    orderBy('createdAt', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function upvoteReview(reviewId) {
  const database = requireDb()
  await updateDoc(doc(database, 'reviews', reviewId), { upvotes: increment(1) })
}

export async function deleteReview(reviewId) {
  const database = requireDb()
  await deleteDoc(doc(database, 'reviews', reviewId))
}

// ---- User profiles ---------------------------------------------------------

export async function ensureUserProfile(user) {
  const database = requireDb()
  await setDoc(
    doc(database, 'users', user.uid),
    {
      displayName: user.displayName || '',
      email: user.email,
      joinedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
