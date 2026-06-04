import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FountainCard from './FountainCard'

const baseFountain = {
  id: 'f1',
  name: 'Barton Springs Fountain',
  address: '2201 Barton Springs Rd, Austin, TX 78746',
  type: 'fountain',
  status: 'active',
  accessible: false,
  notes: '',
}

describe('FountainCard', () => {
  it('renders the fountain name and address', () => {
    render(<FountainCard fountain={baseFountain} />)
    expect(screen.getByText('Barton Springs Fountain')).toBeInTheDocument()
    expect(screen.getByText('2201 Barton Springs Rd, Austin, TX 78746')).toBeInTheDocument()
  })

  it('renders notes when provided', () => {
    const fountain = { ...baseFountain, notes: 'Near the park entrance.' }
    render(<FountainCard fountain={fountain} />)
    expect(screen.getByText('Near the park entrance.')).toBeInTheDocument()
  })

  it('omits notes section when notes is empty', () => {
    render(<FountainCard fountain={{ ...baseFountain, notes: '' }} />)
    expect(screen.queryByText('Near the park entrance.')).not.toBeInTheDocument()
  })

  it('shows distance text when distanceMiles prop is provided', () => {
    render(<FountainCard fountain={baseFountain} distanceMiles={1.3456} />)
    expect(screen.getByText('1.3 mi')).toBeInTheDocument()
  })

  it('omits distance when distanceMiles is not provided', () => {
    render(<FountainCard fountain={baseFountain} />)
    expect(screen.queryByText(/mi$/)).not.toBeInTheDocument()
  })

  it('shows "active" in the status pill for active status', () => {
    render(<FountainCard fountain={{ ...baseFountain, status: 'active' }} />)
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('shows "unverified" in the status pill for unverified status', () => {
    render(<FountainCard fountain={{ ...baseFountain, status: 'unverified' }} />)
    expect(screen.getByText('unverified')).toBeInTheDocument()
  })

  it('shows "inactive" in the status pill for inactive status', () => {
    render(<FountainCard fountain={{ ...baseFountain, status: 'inactive' }} />)
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('calls onLocate with the fountain when "Show on map" is clicked', () => {
    const onLocate = vi.fn()
    render(<FountainCard fountain={baseFountain} onLocate={onLocate} />)
    fireEvent.click(screen.getByRole('button', { name: /show on map/i }))
    expect(onLocate).toHaveBeenCalledOnce()
    expect(onLocate).toHaveBeenCalledWith(baseFountain)
  })

  it('calls onReview with the fountain when "Leave a review" is clicked', () => {
    const onReview = vi.fn()
    render(<FountainCard fountain={baseFountain} onReview={onReview} />)
    fireEvent.click(screen.getByRole('button', { name: /leave a review/i }))
    expect(onReview).toHaveBeenCalledOnce()
    expect(onReview).toHaveBeenCalledWith(baseFountain)
  })

  it('renders both buttons when both callbacks are provided', () => {
    render(
      <FountainCard
        fountain={baseFountain}
        onLocate={vi.fn()}
        onReview={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /show on map/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /leave a review/i })).toBeInTheDocument()
  })

  it('does not render action buttons when no callbacks are provided', () => {
    render(<FountainCard fountain={baseFountain} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('action controls are real <button> elements', () => {
    render(
      <FountainCard
        fountain={baseFountain}
        onLocate={vi.fn()}
        onReview={vi.fn()}
      />,
    )
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn.tagName).toBe('BUTTON')
    })
  })
})
