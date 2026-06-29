import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FountainCard from './FountainCard'
import { makeFountain } from '../../test/fixtures'

const baseFountain = makeFountain({
  id: 'f1',
  name: 'Barton Springs Fountain',
  address: '2201 Barton Springs Rd, Austin, TX 78746',
  type: 'fountain',
  status: 'active',
  accessible: false,
  notes: '',
  lat: 30.2641,
  lng: -97.7713,
})

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

  it('renders a "Get Directions" link with the universal maps href', () => {
    render(<FountainCard fountain={baseFountain} />)
    const link = screen.getByRole('link', { name: /get directions/i })
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=30.2641,-97.7713',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('directions href is a well-formed URL whose destination round-trips the negative Austin longitude', () => {
    // Austin sits at ~ -97.7 lng; the comma + minus sign must survive in a way
    // Google Maps can parse back into "lat,lng". This guards against any future
    // mis-encoding (e.g. encodeURIComponent turning "," into "%2C" inside dir/).
    render(<FountainCard fountain={baseFountain} />)
    const link = screen.getByRole('link', { name: /get directions/i })
    const url = new URL(link.getAttribute('href')!)
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('destination')).toBe('30.2641,-97.7713')
    const [lat, lng] = url.searchParams.get('destination')!.split(',').map(Number)
    expect(lat).toBeCloseTo(30.2641)
    expect(lng).toBeCloseTo(-97.7713)
    expect(lng).toBeLessThan(0) // Austin is west of the prime meridian
  })

  it('builds the directions href correctly for a different (negative-lng) fountain', () => {
    const other = { ...baseFountain, lat: 30.3072, lng: -97.7559 }
    render(<FountainCard fountain={other} />)
    const link = screen.getByRole('link', { name: /get directions/i })
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=30.3072,-97.7559',
    )
  })

  it('does not render the save toggle without onToggleSave', () => {
    render(<FountainCard fountain={baseFountain} />)
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
  })

  it('renders a "Save" toggle and calls onToggleSave when clicked', () => {
    const onToggleSave = vi.fn()
    render(<FountainCard fountain={baseFountain} onToggleSave={onToggleSave} />)
    const btn = screen.getByRole('button', { name: /save fountain/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(btn)
    expect(onToggleSave).toHaveBeenCalledOnce()
    expect(onToggleSave).toHaveBeenCalledWith(baseFountain)
  })

  it('reflects the saved state when saved is true', () => {
    render(
      <FountainCard fountain={baseFountain} saved onToggleSave={vi.fn()} />,
    )
    const btn = screen.getByRole('button', { name: /remove from saved fountains/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    expect(btn).toHaveTextContent(/saved/i)
  })
})
