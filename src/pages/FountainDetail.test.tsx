import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import FountainDetail from './FountainDetail'
import { makeFountain } from '../test/fixtures'

// Mock the contexts so the page renders without the real providers / Firebase.
vi.mock('../context/FountainContext', () => ({
  useFountains: vi.fn(),
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useFountains } from '../context/FountainContext'
import { useAuth } from '../context/AuthContext'

const testFountain = makeFountain({
  id: 'f1',
  name: 'Test Fountain',
  address: '500 Congress Ave, Austin, TX',
  type: 'bottle-filler',
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/fountain/:id" element={<FountainDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FountainDetail', () => {
  beforeEach(() => {
    vi.mocked(useFountains).mockReturnValue({
      fountains: [testFountain],
      loading: false,
      error: null,
    })
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      loading: false,
      firebaseReady: false,
      signOut: vi.fn(),
    })
  })

  it('renders the fountain name and address for a known id', () => {
    renderAt('/fountain/f1')
    expect(
      screen.getByRole('heading', { name: 'Test Fountain' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('500 Congress Ave, Austin, TX'),
    ).toBeInTheDocument()
  })

  it('renders a type badge for the fountain', () => {
    renderAt('/fountain/f1')
    // bottle-filler -> "Bottle Filler" label via typeLabel
    expect(screen.getByText('Bottle Filler')).toBeInTheDocument()
  })

  it('renders a "Back to map" link', () => {
    renderAt('/fountain/f1')
    expect(
      screen.getByRole('link', { name: /back to map/i }),
    ).toBeInTheDocument()
  })

  it('does not call into the review backend (reviews stay empty)', () => {
    renderAt('/fountain/f1')
    // With Firebase not configured, the empty-review state is shown.
    expect(
      screen.getByText('Be the first to review this fountain.'),
    ).toBeInTheDocument()
  })

  it('shows a "Fountain not found" message for an unknown id', () => {
    renderAt('/fountain/nope')
    expect(
      screen.getByRole('heading', { name: /fountain not found/i }),
    ).toBeInTheDocument()
  })
})
