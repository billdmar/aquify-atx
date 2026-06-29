import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Admin from './Admin'
import { makeFountain } from '../test/fixtures'
import type { Submission } from '../types'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/firestore', () => ({
  getPendingSubmissions: vi.fn(),
  setSubmissionStatus: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'
import { getPendingSubmissions, setSubmissionStatus } from '../lib/firestore'

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  const { id, ...fountainData } = makeFountain()
  void id
  return {
    id: 'sub-1',
    fountainData,
    authorUid: 'user-123',
    status: 'pending',
    ...overrides,
  }
}

function renderAdmin() {
  return render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>,
  )
}

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: true,
      signOut: vi.fn(),
    })
  })

  it('renders a row per pending submission', async () => {
    vi.mocked(getPendingSubmissions).mockResolvedValue([
      makeSubmission({ id: 'sub-1', fountainData: { ...makeSubmission().fountainData, name: 'Alpha Fountain' } }),
      makeSubmission({ id: 'sub-2', fountainData: { ...makeSubmission().fountainData, name: 'Beta Fountain' } }),
    ])
    renderAdmin()
    expect(await screen.findByText('Alpha Fountain')).toBeInTheDocument()
    expect(screen.getByText('Beta Fountain')).toBeInTheDocument()
    expect(screen.getAllByText('123 Test St, Austin, TX')).toHaveLength(2)
  })

  it('shows the empty state when there are no pending submissions', async () => {
    vi.mocked(getPendingSubmissions).mockResolvedValue([])
    renderAdmin()
    expect(await screen.findByText('No pending submissions.')).toBeInTheDocument()
  })

  it('approves a submission and removes its row', async () => {
    vi.mocked(getPendingSubmissions).mockResolvedValue([
      makeSubmission({ id: 'sub-1' }),
    ])
    vi.mocked(setSubmissionStatus).mockResolvedValue(undefined)
    renderAdmin()

    const approve = await screen.findByRole('button', {
      name: /approve test fountain/i,
    })
    fireEvent.click(approve)

    await waitFor(() =>
      expect(setSubmissionStatus).toHaveBeenCalledWith('sub-1', 'approved'),
    )
    await waitFor(() =>
      expect(screen.queryByText('Test Fountain')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('No pending submissions.')).toBeInTheDocument()
  })

  it('rejects a submission and removes its row', async () => {
    vi.mocked(getPendingSubmissions).mockResolvedValue([
      makeSubmission({ id: 'sub-1' }),
    ])
    vi.mocked(setSubmissionStatus).mockResolvedValue(undefined)
    renderAdmin()

    const reject = await screen.findByRole('button', {
      name: /reject test fountain/i,
    })
    fireEvent.click(reject)

    await waitFor(() =>
      expect(setSubmissionStatus).toHaveBeenCalledWith('sub-1', 'rejected'),
    )
    await waitFor(() =>
      expect(screen.queryByText('Test Fountain')).not.toBeInTheDocument(),
    )
  })

  it('shows an error and keeps the row when the write fails', async () => {
    vi.mocked(getPendingSubmissions).mockResolvedValue([
      makeSubmission({ id: 'sub-1' }),
    ])
    vi.mocked(setSubmissionStatus).mockRejectedValue(new Error('write failed'))
    renderAdmin()

    fireEvent.click(
      await screen.findByRole('button', { name: /approve test fountain/i }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('write failed')
    expect(screen.getByText('Test Fountain')).toBeInTheDocument()
  })

  it('shows the demo-mode banner when firebase is not ready', async () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: false,
      signOut: vi.fn(),
    })
    vi.mocked(getPendingSubmissions).mockResolvedValue([])
    renderAdmin()
    expect(await screen.findByText('No pending submissions.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/demo mode/i)
  })
})
