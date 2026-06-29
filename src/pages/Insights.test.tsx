import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Insights from './Insights'
import { makeFountain } from '../test/fixtures'

vi.mock('../context/FountainContext', () => ({ useFountains: vi.fn() }))

import { useFountains } from '../context/FountainContext'

describe('Insights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the totals and chart labels', () => {
    vi.mocked(useFountains).mockReturnValue({
      fountains: [
        makeFountain({ id: 'a', type: 'fountain', status: 'active', accessible: true }),
        makeFountain({ id: 'b', type: 'bottle-filler', status: 'active', accessible: true }),
        makeFountain({ id: 'c', type: 'both', status: 'unverified', accessible: false }),
        makeFountain({ id: 'd', type: 'fountain', status: 'inactive', accessible: false }),
      ],
      loading: false,
      error: null,
    })

    render(<Insights />)

    expect(
      screen.getByRole('heading', { name: /fountain insights/i }),
    ).toBeInTheDocument()
    // Total count stat.
    expect(screen.getByText('4')).toBeInTheDocument()
    // 2 / 4 accessible → 50%.
    expect(screen.getByText('50%')).toBeInTheDocument()
    // Chart section headings + a representative label.
    expect(screen.getByText('By facility type')).toBeInTheDocument()
    expect(screen.getByText('By status')).toBeInTheDocument()
    expect(screen.getByText('Drinking Fountain')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows the empty state when there are no fountains', () => {
    vi.mocked(useFountains).mockReturnValue({
      fountains: [],
      loading: false,
      error: null,
    })

    render(<Insights />)
    expect(screen.getByText(/no fountains to summarize/i)).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(useFountains).mockReturnValue({
      fountains: [],
      loading: true,
      error: null,
    })

    render(<Insights />)
    expect(screen.getByText(/loading insights/i)).toBeInTheDocument()
  })
})
