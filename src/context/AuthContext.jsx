// Auth context — exposes the current user and auth status to the whole app.
// Uses the subscribeToAuth helper so it works (reporting "no user") even when
// Firebase is not configured.

import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToAuth, signOut as authSignOut } from '../lib/auth'
import { isFirebaseConfigured } from '../lib/firebase'

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  firebaseReady: false,
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    firebaseReady: isFirebaseConfigured,
    signOut: authSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
