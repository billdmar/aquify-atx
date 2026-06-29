// Route guard for admin-only pages. Like PrivateRoute, but additionally
// requires the signed-in user to be on the admin email allowlist; everyone
// else is redirected home. While auth state is resolving, renders a loading
// state.
//
// SECURITY: the allowlist (isAdmin) is a client-side UX gate, not an
// authorization boundary — see src/lib/admin.ts. Firestore rules enforce the
// real permissions.

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isAdmin } from '../../lib/admin'

export default function AdminRoute({ children }: { children: ReactNode }): ReactNode {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-aqua-700">
        Loading…
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin(currentUser)) {
    return <Navigate to="/" replace />
  }

  return children
}
