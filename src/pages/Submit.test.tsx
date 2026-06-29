import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { User } from 'firebase/auth'
import type { DocumentReference } from 'firebase/firestore'
import Submit from './Submit'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/firestore', () => ({
  submitFountain: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import { submitFountain } from '../lib/firestore'

const signedInUser = { uid: 'u1', email: 'a@b.com', displayName: 'A' } as unknown as User

function renderSubmit() {
  return render(
    <MemoryRouter>
      <Submit />
    </MemoryRouter>,
  )
}

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('Submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: signed in, demo mode (firebaseReady false).
    vi.mocked(useAuth).mockReturnValue({
      currentUser: signedInUser,
      loading: false,
      firebaseReady: false,
      signOut: vi.fn(),
    })
  })

  it('shows the demo-mode banner when firebaseReady is false', () => {
    renderSubmit()
    expect(screen.getByText(/demo mode/i)).toBeInTheDocument()
  })

  it('hides the demo-mode banner when firebaseReady is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: signedInUser,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    renderSubmit()
    expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument()
  })

  it('requires name and address', async () => {
    renderSubmit()
    fireEvent.click(screen.getByRole('button', { name: /submit fountain/i }))
    expect(
      await screen.findByText('Name and address are required.'),
    ).toBeInTheDocument()
    expect(submitFountain).not.toHaveBeenCalled()
  })

  it('rejects an out-of-range latitude', async () => {
    renderSubmit()
    fill(/name/i, 'New Fountain')
    fill(/address/i, '1 Main St')
    fill(/latitude/i, '120')
    fill(/longitude/i, '-97.7')
    fireEvent.click(screen.getByRole('button', { name: /submit fountain/i }))
    expect(
      await screen.findByText('Latitude must be a number between -90 and 90.'),
    ).toBeInTheDocument()
    expect(submitFountain).not.toHaveBeenCalled()
  })

  it('rejects an out-of-range longitude', async () => {
    renderSubmit()
    fill(/name/i, 'New Fountain')
    fill(/address/i, '1 Main St')
    fill(/latitude/i, '30.2')
    fill(/longitude/i, '200')
    fireEvent.click(screen.getByRole('button', { name: /submit fountain/i }))
    expect(
      await screen.findByText(
        'Longitude must be a number between -180 and 180.',
      ),
    ).toBeInTheDocument()
    expect(submitFountain).not.toHaveBeenCalled()
  })

  it('shows the not-signed-in guard message when there is no user', async () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: false,
      signOut: vi.fn(),
    })
    renderSubmit()
    fill(/name/i, 'New Fountain')
    fill(/address/i, '1 Main St')
    fill(/latitude/i, '30.2')
    fill(/longitude/i, '-97.7')
    fireEvent.click(screen.getByRole('button', { name: /submit fountain/i }))
    expect(
      await screen.findByText('Please sign in to submit a fountain.'),
    ).toBeInTheDocument()
    expect(submitFountain).not.toHaveBeenCalled()
  })

  it('submits a valid fountain and shows the success screen', async () => {
    vi.mocked(submitFountain).mockResolvedValue({} as DocumentReference)
    renderSubmit()
    fill(/name/i, '  New Fountain  ')
    fill(/address/i, '1 Main St')
    fill(/latitude/i, '30.2672')
    fill(/longitude/i, '-97.7431')
    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: 'both' },
    })
    fireEvent.click(screen.getByLabelText(/ada accessible/i))
    fireEvent.click(screen.getByRole('button', { name: /submit fountain/i }))

    expect(
      await screen.findByText(/thanks for your submission/i),
    ).toBeInTheDocument()

    await waitFor(() => expect(submitFountain).toHaveBeenCalledTimes(1))
    const [payload, user] = vi.mocked(submitFountain).mock.calls[0]
    expect(payload.name).toBe('New Fountain') // trimmed
    expect(payload.lat).toBe(30.2672)
    expect(payload.lng).toBe(-97.7431)
    expect(payload.type).toBe('both')
    expect(payload.accessible).toBe(true)
    expect(payload.status).toBe('unverified')
    expect(user.uid).toBe('u1')
  })

  it('surfaces an error when submitFountain rejects', async () => {
    vi.mocked(submitFountain).mockRejectedValue(new Error('network down'))
    renderSubmit()
    fill(/name/i, 'New Fountain')
    fill(/address/i, '1 Main St')
    fill(/latitude/i, '30.2')
    fill(/longitude/i, '-97.7')
    fireEvent.click(screen.getByRole('button', { name: /submit fountain/i }))
    expect(await screen.findByText('network down')).toBeInTheDocument()
  })
})
