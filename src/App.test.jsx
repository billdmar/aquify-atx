// Integration smoke test: mounts the entire App (providers + router + pages)
// in jsdom with Firebase unconfigured (demo mode). Catches runtime crashes,
// missing providers, and broken imports that a build alone won't surface.

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Leaflet/react-leaflet don't render in jsdom; stub the lazy map so routing
// and the rest of the tree mount cleanly.
vi.mock('./components/Map/AquifyMap', () => ({
  default: () => <div data-testid="map-stub">map</div>,
}))

import App from './App'

describe('App (demo mode, Firebase unconfigured)', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('renders the navbar and home page without crashing', async () => {
    render(<App />)
    // Brand appears in the navbar.
    expect(screen.getAllByText(/Aquify ATX/i).length).toBeGreaterThan(0)
    // Home heading renders.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /Austin Water Fountains/i }),
      ).toBeInTheDocument(),
    )
  })

  it('shows the demo-mode banner when Firebase is not configured', async () => {
    render(<App />)
    await waitFor(() =>
      expect(screen.getByText(/Demo mode/i)).toBeInTheDocument(),
    )
  })

  it('loads fountains from local seed data in demo mode', async () => {
    render(<App />)
    // The "Showing N of M fountains" counter reflects the 33-entry seed file.
    await waitFor(() =>
      expect(screen.getByText(/of 33 fountains/i)).toBeInTheDocument(),
    )
  })

  it('navigates to the About page', async () => {
    window.history.pushState({}, '', '/about')
    render(<App />)
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /About Aquify ATX/i }),
      ).toBeInTheDocument(),
    )
  })

  it('redirects unauthenticated users away from /submit to /login', async () => {
    window.history.pushState({}, '', '/submit')
    render(<App />)
    // PrivateRoute should bounce to the login form.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /sign in/i }),
      ).toBeInTheDocument(),
    )
  })
})
