import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AquifyMap from './AquifyMap'

// Mock react-leaflet primitives as passthrough elements so we can render the
// map without a real DOM map. Each Marker exposes a test id so we can count them;
// Popup just renders its children so the CTA / type badge are assertable.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ flyTo: vi.fn() }),
}))

// Mock leaflet's divIcon so buildIcon() doesn't touch the real lib.
vi.mock('leaflet', () => ({
  default: { divIcon: vi.fn(() => ({})) },
}))

// Mock AuthContext to control the review CTA gating.
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../context/AuthContext'

const fountains = [
  { id: 'a', name: 'Alpha Fountain', address: '1 Alpha St', type: 'fountain', status: 'active', accessible: false, notes: '', lat: 30.3, lng: -97.74 },
  { id: 'b', name: 'Bravo Filler', address: '2 Bravo St', type: 'bottle-filler', status: 'active', accessible: false, notes: '', lat: 30.25, lng: -97.75 },
]

describe('AquifyMap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one marker per fountain when no userLocation is set', () => {
    useAuth.mockReturnValue({ currentUser: null })
    render(<AquifyMap fountains={fountains} />)
    expect(screen.getAllByTestId('marker')).toHaveLength(2)
  })

  it('adds the user-location marker only when userLocation is provided', () => {
    useAuth.mockReturnValue({ currentUser: null })
    const { rerender } = render(<AquifyMap fountains={fountains} />)
    expect(screen.getAllByTestId('marker')).toHaveLength(2)

    rerender(<AquifyMap fountains={fountains} userLocation={{ lat: 30.26, lng: -97.74 }} />)
    // 2 fountains + 1 user marker.
    expect(screen.getAllByTestId('marker')).toHaveLength(3)
    expect(screen.getByText('Your location')).toBeInTheDocument()
  })

  it('shows a "Leave a review" button when a user is logged in', () => {
    useAuth.mockReturnValue({ currentUser: { email: 'wade@oasis.io' } })
    render(<AquifyMap fountains={fountains} onReview={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: /leave a review/i })).toHaveLength(2)
    expect(screen.queryByText(/log in to review/i)).not.toBeInTheDocument()
  })

  it('gates the review CTA behind auth ("Log in to review") when logged out', () => {
    useAuth.mockReturnValue({ currentUser: null })
    render(<AquifyMap fountains={fountains} />)
    expect(screen.getAllByText(/log in to review/i)).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /leave a review/i })).not.toBeInTheDocument()
  })

  it('renders the type badge label for each fountain', () => {
    useAuth.mockReturnValue({ currentUser: null })
    render(<AquifyMap fountains={fountains} />)
    expect(screen.getByText('Drinking Fountain')).toBeInTheDocument()
    expect(screen.getByText('Bottle Filler')).toBeInTheDocument()
  })
})
