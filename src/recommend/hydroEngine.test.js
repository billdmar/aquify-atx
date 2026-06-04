/**
 * hydroEngine.test.js — Comprehensive unit tests for the hydration engine.
 *
 * Coverage targets:
 *   - scoreHydration: baseline, each rule in isolation, boundary values, all rules
 *   - fetchAustinWeather: success mapping, network error, malformed shape
 *   - getHydrationRecommendation: active-only filter, distance sort, null location
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  FALLBACK_WEATHER,
  scoreHydration,
  fetchAustinWeather,
  getHydrationRecommendation,
} from './hydroEngine'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal weather object, overriding specific fields. */
function weather(overrides = {}) {
  return { tempF: 75, heatIndexF: 78, uvIndex: 3, humidity: 50, ...overrides }
}

/** Build a valid Open-Meteo current payload. */
function makeMeteoResponse(fields = {}) {
  return {
    current: {
      temperature_2m: 75,
      apparent_temperature: 78,
      relativehumidity_2m: 50,
      uv_index: 3,
      ...fields,
    },
  }
}

/** Create a mock fetch that resolves with a JSON body. */
function mockFetch(body, { ok = true, throws = false } = {}) {
  if (throws) {
    return vi.fn().mockRejectedValue(new Error('network error'))
  }
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  })
}

// ---------------------------------------------------------------------------
// scoreHydration — baseline
// ---------------------------------------------------------------------------

describe('scoreHydration — baseline (mild weather, no exercise)', () => {
  it('returns 8 cups when no rules fire', () => {
    const result = scoreHydration(weather(), false)
    expect(result.cups).toBe(8)
  })

  it('returns 0 factors when no rules fire', () => {
    const result = scoreHydration(weather(), false)
    expect(result.factors).toHaveLength(0)
  })

  it('computes liters correctly for 8 cups (≈1.9 L)', () => {
    const result = scoreHydration(weather(), false)
    expect(result.liters).toBeCloseTo(1.9, 1)
  })

  it('reason mentions baseline', () => {
    const result = scoreHydration(weather(), false)
    expect(result.reason).toMatch(/baseline/i)
  })
})

// ---------------------------------------------------------------------------
// scoreHydration — each rule in isolation
// ---------------------------------------------------------------------------

describe('scoreHydration — temperature > 90 rule', () => {
  it('adds +1 cup when tempF is 91', () => {
    expect(scoreHydration(weather({ tempF: 91 }), false).cups).toBe(9)
  })

  it('adds a factor with the temperature label', () => {
    const { factors } = scoreHydration(weather({ tempF: 91 }), false)
    expect(factors).toHaveLength(1)
    expect(factors[0].cups).toBe(1)
    expect(factors[0].label).toMatch(/temperature/i)
  })

  it('reason mentions temperature', () => {
    const { reason } = scoreHydration(weather({ tempF: 91 }), false)
    expect(reason).toMatch(/temperature/i)
  })
})

describe('scoreHydration — heat index > 100 rule', () => {
  it('adds +1 cup when heatIndexF is 101', () => {
    expect(scoreHydration(weather({ heatIndexF: 101 }), false).cups).toBe(9)
  })

  it('adds a factor with the heat index label', () => {
    const { factors } = scoreHydration(weather({ heatIndexF: 101 }), false)
    expect(factors).toHaveLength(1)
    expect(factors[0].cups).toBe(1)
    expect(factors[0].label).toMatch(/heat index/i)
  })

  it('reason mentions heat index', () => {
    const { reason } = scoreHydration(weather({ heatIndexF: 101 }), false)
    expect(reason).toMatch(/heat index/i)
  })
})

describe('scoreHydration — UV index ≥ 6 rule', () => {
  it('adds +1 cup when uvIndex is 6', () => {
    expect(scoreHydration(weather({ uvIndex: 6 }), false).cups).toBe(9)
  })

  it('adds +1 cup when uvIndex is 9', () => {
    expect(scoreHydration(weather({ uvIndex: 9 }), false).cups).toBe(9)
  })

  it('adds a factor with UV label', () => {
    const { factors } = scoreHydration(weather({ uvIndex: 6 }), false)
    expect(factors).toHaveLength(1)
    expect(factors[0].cups).toBe(1)
    expect(factors[0].label).toMatch(/uv/i)
  })

  it('reason mentions UV', () => {
    const { reason } = scoreHydration(weather({ uvIndex: 6 }), false)
    expect(reason).toMatch(/uv/i)
  })
})

describe('scoreHydration — humidity < 30 rule', () => {
  it('adds +0.5 cup when humidity is 29', () => {
    expect(scoreHydration(weather({ humidity: 29 }), false).cups).toBe(8.5)
  })

  it('adds a factor with humidity label', () => {
    const { factors } = scoreHydration(weather({ humidity: 29 }), false)
    expect(factors).toHaveLength(1)
    expect(factors[0].cups).toBe(0.5)
    expect(factors[0].label).toMatch(/humidity/i)
  })
})

describe('scoreHydration — exercise rule', () => {
  it('adds +1 cup when willExercise is true', () => {
    expect(scoreHydration(weather(), true).cups).toBe(9)
  })

  it('adds a factor with exercise label', () => {
    const { factors } = scoreHydration(weather(), true)
    expect(factors).toHaveLength(1)
    expect(factors[0].cups).toBe(1)
    expect(factors[0].label).toMatch(/exercise/i)
  })

  it('reason mentions exercise', () => {
    const { reason } = scoreHydration(weather(), true)
    expect(reason).toMatch(/exercise/i)
  })
})

// ---------------------------------------------------------------------------
// scoreHydration — boundary conditions
// ---------------------------------------------------------------------------

describe('scoreHydration — boundary: temperature', () => {
  it('does NOT add cups when tempF is exactly 90', () => {
    expect(scoreHydration(weather({ tempF: 90 }), false).cups).toBe(8)
  })

  it('adds +1 cup when tempF is 90.1', () => {
    expect(scoreHydration(weather({ tempF: 90.1 }), false).cups).toBe(9)
  })
})

describe('scoreHydration — boundary: heat index', () => {
  it('does NOT add cups when heatIndexF is exactly 100', () => {
    expect(scoreHydration(weather({ heatIndexF: 100 }), false).cups).toBe(8)
  })

  it('adds +1 cup when heatIndexF is 101', () => {
    expect(scoreHydration(weather({ heatIndexF: 101 }), false).cups).toBe(9)
  })
})

describe('scoreHydration — boundary: UV index', () => {
  it('adds +1 cup when uvIndex is exactly 6', () => {
    expect(scoreHydration(weather({ uvIndex: 6 }), false).cups).toBe(9)
  })

  it('does NOT add cups when uvIndex is 5', () => {
    expect(scoreHydration(weather({ uvIndex: 5 }), false).cups).toBe(8)
  })
})

describe('scoreHydration — boundary: humidity', () => {
  it('does NOT add cups when humidity is exactly 30', () => {
    expect(scoreHydration(weather({ humidity: 30 }), false).cups).toBe(8)
  })

  it('adds +0.5 cup when humidity is 29', () => {
    expect(scoreHydration(weather({ humidity: 29 }), false).cups).toBe(8.5)
  })
})

// ---------------------------------------------------------------------------
// scoreHydration — all rules firing
// ---------------------------------------------------------------------------

describe('scoreHydration — all rules firing', () => {
  const hotWeather = { tempF: 98, heatIndexF: 105, uvIndex: 9, humidity: 20 }

  it('returns 12.5 cups (8 + 1 + 1 + 1 + 0.5 + 1)', () => {
    expect(scoreHydration(hotWeather, true).cups).toBe(12.5)
  })

  it('returns 5 factors', () => {
    expect(scoreHydration(hotWeather, true).factors).toHaveLength(5)
  })

  it('computes liters correctly (12.5 * 0.236588 ≈ 3.0)', () => {
    const { liters } = scoreHydration(hotWeather, true)
    expect(liters).toBeCloseTo(12.5 * 0.236588, 1)
  })

  it('reason mentions all fired factors', () => {
    const { reason } = scoreHydration(hotWeather, true)
    expect(reason).toMatch(/temperature/i)
    expect(reason).toMatch(/heat index/i)
    expect(reason).toMatch(/uv/i)
    expect(reason).toMatch(/humidity/i)
    expect(reason).toMatch(/exercise/i)
  })
})

// ---------------------------------------------------------------------------
// scoreHydration — liters rounding
// ---------------------------------------------------------------------------

describe('scoreHydration — liters computation', () => {
  it('rounds to 1 decimal place', () => {
    const { liters } = scoreHydration(weather(), false)
    // 8 * 0.236588 = 1.89270... → rounds to 1.9
    expect(liters).toBe(1.9)
  })

  it('liters = cups * 0.236588 rounded to 1 decimal for 9 cups', () => {
    const { liters } = scoreHydration(weather({ tempF: 91 }), false)
    const expected = Math.round(9 * 0.236588 * 10) / 10
    expect(liters).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// fetchAustinWeather
// ---------------------------------------------------------------------------

describe('fetchAustinWeather — success', () => {
  it('maps Open-Meteo fields to the correct keys', async () => {
    const mockResponse = makeMeteoResponse({
      temperature_2m: 88,
      apparent_temperature: 95,
      relativehumidity_2m: 42,
      uv_index: 8,
    })
    const { weather: w, usedFallback } = await fetchAustinWeather(mockFetch(mockResponse))
    expect(w.tempF).toBe(88)
    expect(w.heatIndexF).toBe(95)
    expect(w.humidity).toBe(42)
    expect(w.uvIndex).toBe(8)
    expect(usedFallback).toBe(false)
  })

  it('returns usedFallback false on valid response', async () => {
    const { usedFallback } = await fetchAustinWeather(mockFetch(makeMeteoResponse()))
    expect(usedFallback).toBe(false)
  })
})

describe('fetchAustinWeather — network failure', () => {
  it('returns FALLBACK_WEATHER when fetch throws', async () => {
    const { weather: w, usedFallback } = await fetchAustinWeather(
      mockFetch(null, { throws: true }),
    )
    expect(w).toEqual(FALLBACK_WEATHER)
    expect(usedFallback).toBe(true)
  })
})

describe('fetchAustinWeather — HTTP error', () => {
  it('returns FALLBACK_WEATHER when response.ok is false', async () => {
    const { weather: w, usedFallback } = await fetchAustinWeather(
      mockFetch({}, { ok: false }),
    )
    expect(w).toEqual(FALLBACK_WEATHER)
    expect(usedFallback).toBe(true)
  })
})

describe('fetchAustinWeather — malformed response', () => {
  it('returns FALLBACK_WEATHER when current is missing', async () => {
    const { weather: w, usedFallback } = await fetchAustinWeather(mockFetch({}))
    expect(w).toEqual(FALLBACK_WEATHER)
    expect(usedFallback).toBe(true)
  })

  it('returns FALLBACK_WEATHER when temperature_2m is not a number', async () => {
    const bad = makeMeteoResponse({ temperature_2m: 'hot' })
    const { weather: w, usedFallback } = await fetchAustinWeather(mockFetch(bad))
    expect(w).toEqual(FALLBACK_WEATHER)
    expect(usedFallback).toBe(true)
  })

  it('returns FALLBACK_WEATHER when uv_index is missing', async () => {
    const bad = { current: { temperature_2m: 80, apparent_temperature: 82, relativehumidity_2m: 50 } }
    const { weather: w, usedFallback } = await fetchAustinWeather(mockFetch(bad))
    expect(w).toEqual(FALLBACK_WEATHER)
    expect(usedFallback).toBe(true)
  })

  it('returns FALLBACK_WEATHER when json() rejects', async () => {
    const broken = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError('bad json')),
    })
    const { weather: w, usedFallback } = await fetchAustinWeather(broken)
    expect(w).toEqual(FALLBACK_WEATHER)
    expect(usedFallback).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getHydrationRecommendation
// ---------------------------------------------------------------------------

const SAMPLE_FOUNTAINS = [
  // active, close (~0.3 mi north of Austin center)
  { id: 'f-close', name: 'Close Fountain', lat: 30.2700, lng: -97.7431, status: 'active' },
  // active, medium distance
  { id: 'f-mid', name: 'Mid Fountain', lat: 30.2800, lng: -97.7431, status: 'active' },
  // inactive — must be excluded
  { id: 'f-inactive', name: 'Inactive Fountain', lat: 30.2672, lng: -97.7431, status: 'inactive' },
  // unverified — must be excluded
  { id: 'f-unverified', name: 'Unverified Fountain', lat: 30.2672, lng: -97.7431, status: 'unverified' },
  // active, far
  { id: 'f-far', name: 'Far Fountain', lat: 30.3100, lng: -97.7431, status: 'active' },
]

describe('getHydrationRecommendation — with location', () => {
  const mockF = mockFetch(makeMeteoResponse())

  beforeEach(() => {
    mockF.mockClear()
  })

  it('returns only active fountains (max 3)', async () => {
    const result = await getHydrationRecommendation(
      30.2672, -97.7431, false, SAMPLE_FOUNTAINS, mockFetch(makeMeteoResponse()),
    )
    expect(result.nearestFountains.length).toBeLessThanOrEqual(3)
    result.nearestFountains.forEach((f) => expect(f.status).toBe('active'))
  })

  it('excludes inactive fountains', async () => {
    const result = await getHydrationRecommendation(
      30.2672, -97.7431, false, SAMPLE_FOUNTAINS, mockFetch(makeMeteoResponse()),
    )
    const ids = result.nearestFountains.map((f) => f.id)
    expect(ids).not.toContain('f-inactive')
    expect(ids).not.toContain('f-unverified')
  })

  it('sorts nearest fountains ascending by distanceMiles', async () => {
    const result = await getHydrationRecommendation(
      30.2672, -97.7431, false, SAMPLE_FOUNTAINS, mockFetch(makeMeteoResponse()),
    )
    const distances = result.nearestFountains.map((f) => f.distanceMiles)
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1])
    }
  })

  it('each fountain has a distanceMiles field that is a positive number', async () => {
    const result = await getHydrationRecommendation(
      30.2672, -97.7431, false, SAMPLE_FOUNTAINS, mockFetch(makeMeteoResponse()),
    )
    result.nearestFountains.forEach((f) => {
      expect(typeof f.distanceMiles).toBe('number')
      expect(f.distanceMiles).toBeGreaterThanOrEqual(0)
    })
  })

  it('returns cups, liters, reason, factors, weather, usedFallback', async () => {
    const result = await getHydrationRecommendation(
      30.2672, -97.7431, false, SAMPLE_FOUNTAINS, mockFetch(makeMeteoResponse()),
    )
    expect(typeof result.cups).toBe('number')
    expect(typeof result.liters).toBe('number')
    expect(typeof result.reason).toBe('string')
    expect(Array.isArray(result.factors)).toBe(true)
    expect(result.weather).toBeDefined()
    expect(typeof result.usedFallback).toBe('boolean')
  })
})

describe('getHydrationRecommendation — null location', () => {
  it('returns nearestFountains as an empty array', async () => {
    const result = await getHydrationRecommendation(
      null, null, false, SAMPLE_FOUNTAINS, mockFetch(makeMeteoResponse()),
    )
    expect(result.nearestFountains).toEqual([])
  })

  it('still returns a valid cups recommendation with null location', async () => {
    const result = await getHydrationRecommendation(
      null, null, false, SAMPLE_FOUNTAINS, mockFetch(makeMeteoResponse()),
    )
    expect(result.cups).toBeGreaterThanOrEqual(8)
  })
})

describe('getHydrationRecommendation — weather integration', () => {
  it('usedFallback true when fetch throws, and cups still computed', async () => {
    const result = await getHydrationRecommendation(
      null, null, false, [], mockFetch(null, { throws: true }),
    )
    expect(result.usedFallback).toBe(true)
    expect(result.cups).toBeGreaterThanOrEqual(8)
  })

  it('exercise flag flows through to cups', async () => {
    const noEx = await getHydrationRecommendation(
      null, null, false, [], mockFetch(makeMeteoResponse()),
    )
    const withEx = await getHydrationRecommendation(
      null, null, true, [], mockFetch(makeMeteoResponse()),
    )
    expect(withEx.cups).toBe(noEx.cups + 1)
  })

  it('returns top 3 (not more) when > 3 active fountains present', async () => {
    const result = await getHydrationRecommendation(
      30.2672, -97.7431, false, SAMPLE_FOUNTAINS, mockFetch(makeMeteoResponse()),
    )
    expect(result.nearestFountains.length).toBe(3)
  })

  it('handles empty fountains array gracefully', async () => {
    const result = await getHydrationRecommendation(
      30.2672, -97.7431, false, [], mockFetch(makeMeteoResponse()),
    )
    expect(result.nearestFountains).toEqual([])
  })

  it('handles undefined fountains gracefully', async () => {
    const result = await getHydrationRecommendation(
      30.2672, -97.7431, false, undefined, mockFetch(makeMeteoResponse()),
    )
    expect(result.nearestFountains).toEqual([])
  })
})
