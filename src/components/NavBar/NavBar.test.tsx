import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { User } from 'firebase/auth'
import NavBar from './NavBar'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }))

import { useAuth } from '../../context/AuthContext'

const signedInUser = {
  uid: 'u1',
  email: 'jane@example.com',
  displayName: 'Jane Doe',
} as unknown as User

function renderNavBar() {
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

  it('shows Login and Register links when logged out', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: false,
      signOut: vi.fn(),
    })
    renderNavBar()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute(
      'href',
      '/register',
    )
    expect(
      screen.queryByRole('button', { name: /sign out/i }),
    ).not.toBeInTheDocument()
  })

  it('shows the user name and Sign Out when logged in', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: signedInUser,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    renderNavBar()
    const profileLink = screen.getByRole('link', { name: 'Jane Doe' })
    expect(profileLink).toHaveAttribute('href', '/profile')
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument()
  })

  it('falls back to the email when there is no display name', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: { uid: 'u1', email: 'jane@example.com', displayName: null } as unknown as User,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    renderNavBar()
    expect(
      screen.getByRole('link', { name: 'jane@example.com' }),
    ).toBeInTheDocument()
  })

  it('Sign Out calls signOut then navigates home', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuth).mockReturnValue({
      currentUser: signedInUser,
      loading: false,
      firebaseReady: true,
      signOut,
    })
    renderNavBar()
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1))
    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('navigates home even when signOut rejects (demo mode)', async () => {
    const signOut = vi.fn().mockRejectedValue(new Error('not configured'))
    vi.mocked(useAuth).mockReturnValue({
      currentUser: signedInUser,
      loading: false,
      firebaseReady: false,
      signOut,
    })
    renderNavBar()
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/'))
  })

  it('renders the theme toggle button', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: false,
      signOut: vi.fn(),
    })
    renderNavBar()
    expect(
      screen.getByRole('button', { name: /theme|dark|light/i }),
    ).toBeInTheDocument()
  })
})
