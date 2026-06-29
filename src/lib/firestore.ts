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
  type Firestore,
  type DocumentReference,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase'
import localFountainsData from '../data/fountains.json'
import type { AppUser, Fountain, Review, Submission } from '../types'

const localFountains = localFountainsData as Fountain[]

const NOT_CONFIGURED =
  'Firebase is not configured. Add your credentials to .env to enable this action.'

/** Max characters accepted for a free-text review comment (mirrors firestore.rules). */
export const MAX_COMMENT_LENGTH = 500

function requireDb(): Firestore {
  if (!isFirebaseConfigured || !db) throw new Error(NOT_CONFIGURED)
  return db
}

// ---- Fountains -------------------------------------------------------------

/** Local seed data, used as the demo-mode fallback. */
export function getLocalFountains(): Fountain[] {
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
export function subscribeToFountains(
  onData: (fountains: Fountain[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!isFirebaseConfigured || !db) {
    onData(localFountains)
    return () => {}
  }
  const q = query(collection(db, 'fountains'))
  return onSnapshot(
    q,
    (snap) =>
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Fountain)),
    (err) => {
      if (onError) onError(err)
    },
  )
}

// ---- Submissions -----------------------------------------------------------

export async function submitFountain(
  fountainData: Omit<Fountain, 'id'>,
  user: AppUser,
): Promise<DocumentReference> {
  const database = requireDb()
  return addDoc(collection(database, 'submissions'), {
    fountainData,
    authorUid: user.uid,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function getUserSubmissions(uid: string): Promise<Submission[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'submissions'),
    where('authorUid', '==', uid),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Submission)
}

/**
 * All pending submissions awaiting moderation, oldest first. In demo mode (no
 * Firebase) there is no backend, so this resolves to an empty queue.
 */
export async function getPendingSubmissions(): Promise<Submission[]> {
  if (!isFirebaseConfigured || !db) return []
  const q = query(
    collection(db, 'submissions'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Submission)
}

/**
 * Approve or reject a submission. Throws the not-configured error in demo mode,
 * like the other write helpers.
 *
 * NOTE: this is a privileged write — firestore.rules MUST restrict submission
 * status updates to admins; the client-side allowlist is only a UX gate.
 */
export async function setSubmissionStatus(
  id: string,
  status: 'approved' | 'rejected',
): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'submissions', id), { status })
}

// ---- Reviews ---------------------------------------------------------------

export async function addReview(
  fountainId: string,
  { rating, comment }: { rating: number; comment: string },
  user: AppUser,
): Promise<DocumentReference> {
  const database = requireDb()
  // Store a public display name only — never the author's email (privacy:
  // reviews are publicly readable). Cap comment length to match firestore.rules.
  return addDoc(collection(database, 'reviews'), {
    fountainId,
    authorUid: user.uid,
    authorName: user.displayName || 'Anonymous',
    rating,
    comment: (comment ?? '').slice(0, MAX_COMMENT_LENGTH),
    upvotes: 0,
    createdAt: serverTimestamp(),
  })
}

export async function getReviewsForFountain(
  fountainId: string,
  max = 10,
): Promise<Review[]> {
  const database = requireDb()
  const q = query(
    collection(database, 'reviews'),
    where('fountainId', '==', fountainId),
    orderBy('createdAt', 'desc'),
    limit(max),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review)
}

export async function upvoteReview(reviewId: string): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'reviews', reviewId), { upvotes: increment(1) })
}

export async function deleteReview(reviewId: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'reviews', reviewId))
}

// ---- User profiles ---------------------------------------------------------

export async function ensureUserProfile(user: AppUser): Promise<void> {
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
