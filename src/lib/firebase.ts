// Firebase initialization — lazy singletons.
//
// All config comes from Vite env vars (VITE_FIREBASE_*) — never hardcoded.
// Copy .env.example to .env and fill in your project's values.
//
// Initialization is deferred until the first call to getAuthInstance() /
// getDbInstance(), so importing this module (or anything that depends on it)
// never touches the Firebase SDK at module-load time. The instances are
// memoized in module-scoped vars after the first call.
//
// Graceful degradation: if the env vars are absent (e.g. a fresh clone, or
// CI without secrets), `isFirebaseConfigured` is false and the getters return
// null. The UI checks this flag and shows a "Configure Firebase" notice
// instead of crashing. This lets the app build, lint, test, and render
// without a live Firebase project.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Considered configured only when the essential keys are present and non-empty.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain &&
    firebaseConfig.appId,
)

if (!isFirebaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Aquify] Firebase is not configured. Copy .env.example to .env and ' +
      'add your Firebase project credentials to enable auth and the database. ' +
      'The app will run in a limited, read-only demo mode using local seed data.',
  )
}

// Memoized instances, created on first access.
let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

/** Lazily create (and memoize) the Firebase app, or null if not configured. */
function getApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

/**
 * The Auth instance, initialized on first call and memoized. Returns null when
 * Firebase is not configured (demo mode).
 */
export function getAuthInstance(): Auth | null {
  if (!isFirebaseConfigured) return null
  if (!authInstance) {
    const a = getApp()
    if (a) authInstance = getAuth(a)
  }
  return authInstance
}

/**
 * The Firestore instance, initialized on first call and memoized. Returns null
 * when Firebase is not configured (demo mode).
 */
export function getDbInstance(): Firestore | null {
  if (!isFirebaseConfigured) return null
  if (!dbInstance) {
    const a = getApp()
    if (a) dbInstance = getFirestore(a)
  }
  return dbInstance
}
