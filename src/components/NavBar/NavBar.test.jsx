import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import NavBar from './NavBar'

// Mock AuthContext to avoid real Firebase subscription.
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../context/AuthContext'

function renderNav() {
  return render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>,
  )
}

describe('NavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows Login and Register when logged out', () => {
    useAuth.mockReturnValue({ currentUser: null, signOut: vi.fn() })
    renderNav()
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
    // No Sign Out button when logged out.
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('shows the user name and Sign Out when logged in', () => {
    useAuth.mockReturnValue({
      currentUser: { displayName: 'Wade Watts', email: 'wade@oasis.io' },
      signOut: vi.fn().mockResolvedValue(undefined),
    })
    renderNav()
    expect(screen.getByRole('link', { name: 'Wade Watts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    // Logged-in users don't see Login/Register.
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument()
  })

  it('falls back to email when displayName is missing', () => {
    useAuth.mockReturnValue({
      currentUser: { displayName: '', email: 'wade@oasis.io' },
      signOut: vi.fn(),
    })
    renderNav()
    expect(screen.getByRole('link', { name: 'wade@oasis.io' })).toBeInTheDocument()
  })

  it('calls signOut when Sign Out is clicked', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    useAuth.mockReturnValue({ currentUser: { email: 'wade@oasis.io' }, signOut })
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce())
  })

  it('still navigates home (no crash) when signOut throws in demo mode', async () => {
    const signOut = vi.fn().mockRejectedValue(new Error('demo mode'))
    useAuth.mockReturnValue({ currentUser: { email: 'wade@oasis.io' }, signOut })
    renderNav()
    // The handler swallows the rejection; clicking must not throw.
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce())
    // Component is still mounted afterward.
    expect(screen.getByText('Aquify ATX')).toBeInTheDocument()
  })
})
