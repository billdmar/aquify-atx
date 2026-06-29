// Firebase initialization singleton.
//
// All config comes from Vite env vars (VITE_FIREBASE_*) — never hardcoded.
// Copy .env.example to .env and fill in your project's values.
//
// Graceful degradation: if the env vars are absent (e.g. a fresh clone, or
// CI without secrets), `isFirebaseConfigured` is false and `auth`/`db` are
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

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} else if (import.meta.env.DEV) {
  console.warn(
    '[Aquify] Firebase is not configured. Copy .env.example to .env and ' +
      'add your Firebase project credentials to enable auth and the database. ' +
      'The app will run in a limited, read-only demo mode using local seed data.',
  )
}

export { app, auth, db }
