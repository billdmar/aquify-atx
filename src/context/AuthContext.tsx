// Auth context — exposes the current user and auth status to the whole app.
// Uses the subscribeToAuth helper so it works (reporting "no user") even when
// Firebase is not configured.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'
import { subscribeToAuth, signOut as authSignOut } from '../lib/auth'
import { isFirebaseConfigured } from '../lib/firebase'

interface AuthContextValue {
  currentUser: User | null
  loading: boolean
  firebaseReady: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  loading: true,
  firebaseReady: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Memoize so subscribers don't re-render on every provider render — the
  // value only changes when currentUser or loading actually changes.
  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      loading,
      firebaseReady: isFirebaseConfigured,
      signOut: authSignOut,
    }),
    [currentUser, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
