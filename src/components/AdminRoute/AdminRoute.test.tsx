import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { User } from 'firebase/auth'
import AdminRoute from './AdminRoute'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../lib/admin', () => ({
  isAdmin: vi.fn(),
}))

import { useAuth } from '../../context/AuthContext'
import { isAdmin } from '../../lib/admin'

const adminUser = { email: 'admin@example.com' } as User

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div>Admin Content</div>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state while auth is resolving', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: true,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    renderGuard()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('renders children for an admin user', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: adminUser,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    vi.mocked(isAdmin).mockReturnValue(true)
    renderGuard()
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('redirects an authenticated non-admin to home', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: { email: 'user@example.com' } as User,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    vi.mocked(isAdmin).mockReturnValue(false)
    renderGuard()
    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('redirects an unauthenticated visitor to login', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    vi.mocked(isAdmin).mockReturnValue(false)
    renderGuard()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })
})
