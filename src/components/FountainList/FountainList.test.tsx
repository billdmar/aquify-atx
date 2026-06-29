import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import FountainList from './FountainList'
import { makeFountain } from '../../test/fixtures'
import type { ReactElement } from 'react'

// FountainCard renders a react-router <Link> ("Get Directions" is a plain
// anchor, but the card lives in a routed app), so wrap renders in a router.
function renderInRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('FountainList', () => {
  it('shows the empty state when there are no fountains', () => {
    renderInRouter(<FountainList fountains={[]} />)
    expect(
      screen.getByText('No fountains match your filters.'),
    ).toBeInTheDocument()
  })

  it('renders one card per fountain', () => {
    const fountains = [
      makeFountain({ id: 'a', name: 'Alpha Fountain' }),
      makeFountain({ id: 'b', name: 'Bravo Fountain' }),
      makeFountain({ id: 'c', name: 'Charlie Fountain' }),
    ]
    renderInRouter(<FountainList fountains={fountains} />)
    expect(screen.getByText('Alpha Fountain')).toBeInTheDocument()
    expect(screen.getByText('Bravo Fountain')).toBeInTheDocument()
    expect(screen.getByText('Charlie Fountain')).toBeInTheDocument()
  })

  it('sorts alphabetically by name when no userLocation is given', () => {
    const fountains = [
      makeFountain({ id: 'c', name: 'Charlie Fountain' }),
      makeFountain({ id: 'a', name: 'Alpha Fountain' }),
      makeFountain({ id: 'b', name: 'Bravo Fountain' }),
    ]
    renderInRouter(<FountainList fountains={fountains} />)
    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(names).toEqual([
      'Alpha Fountain',
      'Bravo Fountain',
      'Charlie Fountain',
    ])
  })

  it('shows a distance on each card when userLocation is provided', () => {
    const fountains = [
      makeFountain({ id: 'a', name: 'Alpha Fountain', lat: 30.27, lng: -97.74 }),
    ]
    renderInRouter(
      <FountainList
        fountains={fountains}
        userLocation={{ lat: 30.3, lng: -97.7 }}
      />,
    )
    expect(screen.getByText('Alpha Fountain')).toBeInTheDocument()
    // FountainCard renders the distance as "N.N mi" when distanceMiles is set.
    expect(screen.getByText(/\d+(\.\d+)? mi/)).toBeInTheDocument()
  })

  it('does not show a distance when no userLocation is provided', () => {
    const fountains = [makeFountain({ id: 'a', name: 'Alpha Fountain' })]
    renderInRouter(<FountainList fountains={fountains} />)
    expect(screen.queryByText(/ mi/)).not.toBeInTheDocument()
  })
})
