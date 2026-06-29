import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { User } from 'firebase/auth'
import Register from './Register'

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

vi.mock('../lib/auth', () => ({
  registerWithEmail: vi.fn(),
  mapAuthError: (err: unknown) =>
    err instanceof Error ? err.message : 'Could not create account.',
}))

vi.mock('../lib/firestore', () => ({
  ensureUserProfile: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import { registerWithEmail } from '../lib/auth'
import { ensureUserProfile } from '../lib/firestore'

const newUser = { uid: 'u9', email: 'new@user.com', displayName: 'New User' } as unknown as User

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  )
}

function fillValid() {
  fireEvent.change(screen.getByLabelText('Display Name'), {
    target: { value: 'New User' },
  })
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'new@user.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'secret1' },
  })
  fireEvent.change(screen.getByLabelText('Confirm Password'), {
    target: { value: 'secret1' },
  })
}

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: false,
      signOut: vi.fn(),
    })
  })

  it('shows all required-field errors when submitting empty', async () => {
    renderRegister()
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText('Display name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(screen.getByText('Please confirm your password.')).toBeInTheDocument()
    expect(registerWithEmail).not.toHaveBeenCalled()
  })

  it('rejects a malformed email', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: 'New User' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret1' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'secret1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument()
  })

  it('rejects a short password', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: 'New User' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@user.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: '123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(
      await screen.findByText('Password must be at least 6 characters.'),
    ).toBeInTheDocument()
  })

  it('rejects mismatched password confirmation', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: 'New User' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@user.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret1' },
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'secret2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(registerWithEmail).not.toHaveBeenCalled()
  })

  it('registers, ensures the profile, and navigates home on success', async () => {
    vi.mocked(registerWithEmail).mockResolvedValue(newUser)
    vi.mocked(ensureUserProfile).mockResolvedValue(undefined)
    renderRegister()
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(registerWithEmail).toHaveBeenCalledWith(
        'new@user.com',
        'secret1',
        'New User',
      ),
    )
    await waitFor(() => expect(ensureUserProfile).toHaveBeenCalledWith(newUser))
    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('shows the mapped auth error when registration fails', async () => {
    vi.mocked(registerWithEmail).mockRejectedValue(
      new Error('Email already in use.'),
    )
    renderRegister()
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText('Email already in use.')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('renders a link to the login page', () => {
    renderRegister()
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/login')
  })
})
