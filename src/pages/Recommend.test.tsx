import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Recommend from './Recommend'
import { makeFountain } from '../test/fixtures'
import type { HydrationRecommendation } from '../types'
import type { AiHydration } from '../recommend/aiHydrate'

vi.mock('../context/FountainContext', () => ({ useFountains: vi.fn() }))
vi.mock('../recommend/hydroEngine', () => ({
  getHydrationRecommendation: vi.fn(),
}))
vi.mock('../recommend/aiHydrate', () => ({ getAiHydration: vi.fn() }))

import { useFountains } from '../context/FountainContext'
import { getHydrationRecommendation } from '../recommend/hydroEngine'
import { getAiHydration } from '../recommend/aiHydrate'

const recommendation: HydrationRecommendation = {
  cups: 9,
  liters: 2.1,
  reason: 'Hot and sunny in Austin today.',
  factors: [{ label: 'high heat', cups: 2 }],
  weather: { tempF: 98, heatIndexF: 104, uvIndex: 7, humidity: 40 },
  usedFallback: false,
  nearestFountains: [
    {
      ...makeFountain({ id: 'f1', name: 'Republic Square Tap', address: '422 Guadalupe' }),
      distanceMiles: 0.34,
    },
  ],
}

function renderRecommend() {
  return render(
    <MemoryRouter>
      <Recommend />
    </MemoryRouter>,
  )
}

describe('Recommend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFountains).mockReturnValue({
      fountains: [],
      loading: false,
      error: null,
    })
    vi.mocked(getHydrationRecommendation).mockResolvedValue(recommendation)
    // Fallback path: AI helper returns null, so the rule-based result stands.
    vi.mocked(getAiHydration).mockResolvedValue(null)
    // Force the no-geolocation branch for a deterministic run.
    vi.stubGlobal('navigator', { geolocation: undefined })
  })

  it('renders the page header and CTA', () => {
    renderRecommend()
    expect(
      screen.getByRole('heading', { name: /hydration recommendation/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /get my recommendation/i }),
    ).toBeInTheDocument()
  })

  it('shows the rule-based result (cups, reason, factor) after requesting', async () => {
    renderRecommend()
    fireEvent.click(
      screen.getByRole('button', { name: /get my recommendation/i }),
    )
    expect(await screen.findByText('9')).toBeInTheDocument()
    expect(screen.getByText('cups per day')).toBeInTheDocument()
    expect(screen.getByText('2.1 liters')).toBeInTheDocument()
    expect(screen.getByText('Hot and sunny in Austin today.')).toBeInTheDocument()
    expect(screen.getByText('high heat')).toBeInTheDocument()
  })

  it('renders the weather strip values', async () => {
    renderRecommend()
    fireEvent.click(
      screen.getByRole('button', { name: /get my recommendation/i }),
    )
    expect(await screen.findByText('98°F')).toBeInTheDocument() // temp
    expect(screen.getByText('104°F')).toBeInTheDocument() // heat index
    expect(screen.getByText('7')).toBeInTheDocument() // uv index
    expect(screen.getByText('40%')).toBeInTheDocument() // humidity
  })

  it('renders the nearest fountain card', async () => {
    renderRecommend()
    fireEvent.click(
      screen.getByRole('button', { name: /get my recommendation/i }),
    )
    expect(await screen.findByText('Republic Square Tap')).toBeInTheDocument()
    expect(screen.getByText('0.34 mi away')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /take me there/i }),
    ).toHaveAttribute('href', '/?focus=f1')
  })

  it('does not render the AI tip card on the fallback (null) path', async () => {
    renderRecommend()
    fireEvent.click(
      screen.getByRole('button', { name: /get my recommendation/i }),
    )
    await screen.findByText('9')
    await waitFor(() => expect(getAiHydration).toHaveBeenCalled())
    expect(screen.queryByText(/ai-powered/i)).not.toBeInTheDocument()
  })

  it('shows the AI tip card when getAiHydration resolves a tip', async () => {
    const ai: AiHydration = {
      cups: 10,
      tip: 'Sip water every 20 minutes while outdoors.',
      source: 'gemini',
    }
    vi.mocked(getAiHydration).mockResolvedValue(ai)
    renderRecommend()
    fireEvent.click(
      screen.getByRole('button', { name: /get my recommendation/i }),
    )
    expect(
      await screen.findByText('Sip water every 20 minutes while outdoors.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/ai-powered/i)).toBeInTheDocument()
  })

  it('shows an error message when the engine throws', async () => {
    vi.mocked(getHydrationRecommendation).mockRejectedValue(new Error('fail'))
    renderRecommend()
    fireEvent.click(
      screen.getByRole('button', { name: /get my recommendation/i }),
    )
    expect(
      await screen.findByText(/something went wrong calculating your recommendation/i),
    ).toBeInTheDocument()
  })
})
