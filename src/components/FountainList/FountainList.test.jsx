import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FountainList from './FountainList'

// Three fountains whose alphabetical order differs from their distance order
// (so the two sort modes are distinguishable). Austin-area coords.
const alpha = {
  id: 'a',
  name: 'Alpha Fountain',
  address: '1 Alpha St',
  type: 'fountain',
  status: 'active',
  accessible: false,
  notes: '',
  lat: 30.30,
  lng: -97.74,
}
const bravo = {
  id: 'b',
  name: 'Bravo Fountain',
  address: '2 Bravo St',
  type: 'fountain',
  status: 'active',
  accessible: false,
  notes: '',
  lat: 30.25,
  lng: -97.75,
}
const charlie = {
  id: 'c',
  name: 'Charlie Fountain',
  address: '3 Charlie St',
  type: 'fountain',
  status: 'active',
  accessible: false,
  notes: '',
  lat: 30.40,
  lng: -97.70,
}

describe('FountainList', () => {
  it('renders the empty-state message when there are no fountains', () => {
    render(<FountainList fountains={[]} />)
    expect(screen.getByText('No fountains match your filters.')).toBeInTheDocument()
    // No fountain cards rendered.
    expect(screen.queryByText('Alpha Fountain')).not.toBeInTheDocument()
  })

  it('defaults to an empty list when fountains prop is omitted', () => {
    render(<FountainList />)
    expect(screen.getByText('No fountains match your filters.')).toBeInTheDocument()
  })

  it('sorts alphabetically by name when no userLocation is provided', () => {
    // Pass in non-alphabetical order; expect rendered order Alpha, Bravo, Charlie.
    render(<FountainList fountains={[charlie, alpha, bravo]} />)
    // Card titles are headings — query those specifically (not the type badge text).
    const names = screen.getAllByRole('heading').map((el) => el.textContent)
    expect(names).toEqual(['Alpha Fountain', 'Bravo Fountain', 'Charlie Fountain'])
  })

  it('sorts by distance ascending when userLocation is provided', () => {
    // From a point nearest Bravo, then Alpha, then Charlie — different from alphabetical.
    const userLocation = { lat: 30.25, lng: -97.75 }
    render(<FountainList fountains={[alpha, bravo, charlie]} userLocation={userLocation} />)
    const names = screen.getAllByRole('heading').map((el) => el.textContent)
    expect(names).toEqual(['Bravo Fountain', 'Alpha Fountain', 'Charlie Fountain'])
  })

  it('shows a distance annotation on cards when userLocation is known', () => {
    render(<FountainList fountains={[alpha]} userLocation={{ lat: 30.30, lng: -97.74 }} />)
    // FountainCard renders "<n> mi" when distanceMiles is passed.
    expect(screen.getByText(/mi$/)).toBeInTheDocument()
  })

  it('omits distance annotations when no userLocation is provided', () => {
    render(<FountainList fountains={[alpha, bravo]} />)
    expect(screen.queryByText(/mi$/)).not.toBeInTheDocument()
  })
})
