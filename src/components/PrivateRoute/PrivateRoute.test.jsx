import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'

// Mock AuthContext to avoid real Firebase subscription.
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../context/AuthContext'

// Render PrivateRoute guarding a protected page, with a visible /login target
// so we can assert the redirect happened.
function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route
          path="/secret"
          element={
            <PrivateRoute>
              <div>Secret content</div>
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading state while auth is resolving', () => {
    useAuth.mockReturnValue({ currentUser: null, loading: true })
    renderGuarded()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
  })

  it('redirects to /login when there is no authenticated user', () => {
    useAuth.mockReturnValue({ currentUser: null, loading: false })
    renderGuarded()
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
  })

  it('renders the protected children when a user is authenticated', () => {
    useAuth.mockReturnValue({ currentUser: { email: 'wade@oasis.io' }, loading: false })
    renderGuarded()
    expect(screen.getByText('Secret content')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })
})
