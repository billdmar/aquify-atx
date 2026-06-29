import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

// Mock AuthContext to avoid real Firebase subscription
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock auth helpers so they never touch Firebase
vi.mock('../lib/auth', () => ({
  signInWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    // Firebase NOT configured — demo mode
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: false,
      signOut: vi.fn(),
    })
  })

  it('renders the email input', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders the password input', () => {
    renderLogin()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the Sign In button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('renders the Sign in with Google button', () => {
    renderLogin()
    expect(
      screen.getByRole('button', { name: /sign in with google/i }),
    ).toBeInTheDocument()
  })

  it('shows the demo-mode banner when firebaseReady is false', () => {
    renderLogin()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/demo mode/i)
  })

  it('does NOT show the demo-mode banner when firebaseReady is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
    renderLogin()
    // No role="status" element
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows email validation error when submitting with empty email', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
  })

  it('shows password validation error when submitting with empty password', async () => {
    renderLogin()
    // Fill in a valid email but leave password blank
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText('Password is required.')).toBeInTheDocument()
  })

  it('shows invalid-email error for a malformed email', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument()
  })

  it('shows short-password error when password is fewer than 6 characters', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(
      await screen.findByText('Password must be at least 6 characters.'),
    ).toBeInTheDocument()
  })

  it('shows both validation errors when both fields are empty', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(await screen.findByText('Password is required.')).toBeInTheDocument()
  })

  it('renders a link to the registration page', () => {
    renderLogin()
    const link = screen.getByRole('link', { name: /create one/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/register')
  })
})
