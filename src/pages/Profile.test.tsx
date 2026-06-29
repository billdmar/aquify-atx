import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { User } from 'firebase/auth'
import Profile from './Profile'
import { makeFountain } from '../test/fixtures'
import type { Submission } from '../types'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../context/FountainContext', () => ({ useFountains: vi.fn() }))
vi.mock('../lib/firestore', () => ({ getUserSubmissions: vi.fn() }))
vi.mock('../lib/favorites', () => ({
  subscribeToFavorites: vi.fn(),
  removeFavorite: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import { useFountains } from '../context/FountainContext'
import { getUserSubmissions } from '../lib/firestore'
import { subscribeToFavorites, removeFavorite } from '../lib/favorites'

const signedInUser = {
  uid: 'u1',
  email: 'jane@example.com',
  displayName: 'Jane Doe',
} as unknown as User

const savedFountain = makeFountain({ id: 'f1', name: 'Zilker Tap', address: '2100 Barton Springs' })

function renderProfile() {
  return render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>,
  )
}

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: signedInUser,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn().mockResolvedValue(undefined),
    })
    vi.mocked(useFountains).mockReturnValue({
      fountains: [savedFountain],
      loading: false,
      error: null,
    })
    vi.mocked(getUserSubmissions).mockResolvedValue([])
    // No favorites by default; emit empty list synchronously.
    vi.mocked(subscribeToFavorites).mockImplementation((_uid, onData) => {
      onData([])
      return () => {}
    })
  })

  it('shows the sign-in prompt when there is no current user', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    renderProfile()
    expect(
      screen.getByText('Please sign in to view your profile.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('renders the signed-in user name and email', () => {
    renderProfile()
    expect(
      screen.getByRole('heading', { name: 'Jane Doe', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('jane@example.com').length).toBeGreaterThan(0)
  })

  it('shows the empty-submissions state when there are none', async () => {
    renderProfile()
    expect(
      await screen.findByText("You haven't submitted any fountains yet."),
    ).toBeInTheDocument()
  })

  it('lists the user submissions returned by getUserSubmissions', async () => {
    const submission: Submission = {
      id: 's1',
      fountainData: {
        name: 'Pecan St Filler',
        address: '6th St',
        lat: 30.2,
        lng: -97.7,
        type: 'bottle-filler',
        status: 'unverified',
        accessible: true,
      },
      authorUid: 'u1',
      status: 'approved',
    }
    vi.mocked(getUserSubmissions).mockResolvedValue([submission])
    renderProfile()
    expect(await screen.findByText('Pecan St Filler')).toBeInTheDocument()
    expect(screen.getByText('approved')).toBeInTheDocument()
  })

  it('surfaces a submissions load error', async () => {
    vi.mocked(getUserSubmissions).mockRejectedValue(new Error('boom'))
    renderProfile()
    expect(await screen.findByText('boom')).toBeInTheDocument()
  })

  it('shows the empty-saved state when no favorites', () => {
    renderProfile()
    expect(
      screen.getByText(/haven't saved any fountains yet/i),
    ).toBeInTheDocument()
  })

  it('lists saved fountains resolved from favorite ids', async () => {
    vi.mocked(subscribeToFavorites).mockImplementation((_uid, onData) => {
      onData(['f1'])
      return () => {}
    })
    renderProfile()
    expect(await screen.findByText('Zilker Tap')).toBeInTheDocument()
    expect(screen.getByText('2100 Barton Springs')).toBeInTheDocument()
  })

  it('unsaves a fountain via removeFavorite', async () => {
    vi.mocked(removeFavorite).mockResolvedValue(undefined)
    vi.mocked(subscribeToFavorites).mockImplementation((_uid, onData) => {
      onData(['f1'])
      return () => {}
    })
    renderProfile()
    const unsaveBtn = await screen.findByRole('button', {
      name: /remove zilker tap from saved fountains/i,
    })
    fireEvent.click(unsaveBtn)
    await waitFor(() =>
      expect(removeFavorite).toHaveBeenCalledWith('f1', signedInUser),
    )
    expect(screen.queryByText('Zilker Tap')).not.toBeInTheDocument()
  })

  it('signs out and navigates home', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuth).mockReturnValue({
      currentUser: signedInUser,
      loading: false,
      firebaseReady: true,
      signOut,
    })
    renderProfile()
    fireEvent.click(screen.getByRole('button', { name: /^sign out$/i }))
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1))
    expect(navigateMock).toHaveBeenCalledWith('/')
  })
})
