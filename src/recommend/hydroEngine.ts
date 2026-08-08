/**
 * hydroEngine.ts — Rule-based hydration recommendation engine for Austin, TX.
 *
 * SCORING TABLE (cups added to 8-cup baseline):
 * ┌─────────────────────────────────────┬──────┐
 * │ Rule                                │ Cups │
 * ├─────────────────────────────────────┼──────┤
 * │ Temperature > 90 °F                 │  +1  │
 * │ Heat index > 100 °F                 │  +1  │
 * │ UV index ≥ 6                        │  +1  │
 * │ Relative humidity < 30 %            │ +0.5 │
 * │ User plans to exercise              │  +1  │
 * └─────────────────────────────────────┴──────┘
 *
 * Data source: Open-Meteo (free, no key required).
 * All functions are pure or accept injected dependencies for testability.
 */

import { nearest } from '../lib/geo'
import type {
  Fountain,
  HydrationRecommendation,
  HydrationScore,
  LatLng,
  Weather,
} from '../types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUSTIN_LATLNG: LatLng = { lat: 30.2672, lng: -97.7431 }

/** Documented Austin warm-season averages used when live weather is unavailable. */
export const FALLBACK_WEATHER: Weather = {
  tempF: 95,
  heatIndexF: 99,
  uvIndex: 7,
  humidity: 45,
}

export const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=30.2672&longitude=-97.7431' +
  '&current=temperature_2m,apparent_temperature,relativehumidity_2m,uv_index' +
  '&temperature_unit=fahrenheit' +
  '&timezone=America%2FChicago'

// ---------------------------------------------------------------------------
// Pure scoring function
// ---------------------------------------------------------------------------

/**
 * Compute a hydration recommendation from weather conditions.
 */
export function scoreHydration(
  weather: Weather,
  willExercise: boolean,
): HydrationScore {
  const { tempF, heatIndexF, uvIndex, humidity } = weather
  const factors: HydrationScore['factors'] = []

  if (tempF > 90) {
    factors.push({ label: `high temperature (${Math.round(tempF)}°F)`, cups: 1 })
  }
  if (heatIndexF > 100) {
    factors.push({ label: `high heat index (${Math.round(heatIndexF)}°F)`, cups: 1 })
  }
  if (uvIndex >= 6) {
    factors.push({ label: `strong UV (index ${uvIndex})`, cups: 1 })
  }
  if (humidity < 30) {
    factors.push({ label: `low humidity (${humidity}%)`, cups: 0.5 })
  }
  if (willExercise) {
    factors.push({ label: 'planned exercise', cups: 1 })
  }

  const added = factors.reduce((sum, f) => sum + f.cups, 0)
  const cups = 8 + added
  const liters = Math.round(cups * 0.236588 * 10) / 10

  let reason
  if (factors.length === 0) {
    reason = 'Standard baseline of 8 cups recommended for mild conditions.'
  } else {
    const labels = factors.map((f) => f.label).join(', ')
    reason = `Higher intake recommended: ${labels}.`
  }

  return { cups, liters, reason, factors }
}

// ---------------------------------------------------------------------------
// Weather fetch (injectable for tests)
// ---------------------------------------------------------------------------

type WeatherResult = { weather: Weather; usedFallback: boolean }

/** Time window (ms) during which a fetched weather result is reused. */
const WEATHER_CACHE_TTL_MS = 60_000

// Module-level cache: weather changes slowly, so back-to-back recommendations
// (e.g. toggling "exercise" and re-running) reuse one fetch within the window
// instead of hammering Open-Meteo. Keyed only on time.
let weatherCache: { value: WeatherResult; at: number } | null = null

/**
 * Reset the weather cache. Test helper — lets each test start from a clean
 * slate so cached results don't leak across cases.
 */
export function __clearWeatherCache(): void {
  weatherCache = null
}

/**
 * Fetch current Austin weather from Open-Meteo.
 * On any failure returns FALLBACK_WEATHER with usedFallback:true.
 *
 * Results are cached for WEATHER_CACHE_TTL_MS; a call within that window
 * returns the cached result without invoking `fetchImpl`.
 */
export async function fetchAustinWeather(
  fetchImpl: typeof fetch = fetch,
): Promise<WeatherResult> {
  if (weatherCache && Date.now() - weatherCache.at < WEATHER_CACHE_TTL_MS) {
    return weatherCache.value
  }
  const result = await fetchAustinWeatherUncached(fetchImpl)
  weatherCache = { value: result, at: Date.now() }
  return result
}

async function fetchAustinWeatherUncached(
  fetchImpl: typeof fetch,
): Promise<WeatherResult> {
  try {
    const res = await fetchImpl(OPEN_METEO_URL)
    if (!res.ok) {
      return { weather: FALLBACK_WEATHER, usedFallback: true }
    }
    const json = await res.json()
    const c = json?.current
    if (
      c == null ||
      typeof c.temperature_2m !== 'number' ||
      typeof c.apparent_temperature !== 'number' ||
      typeof c.relativehumidity_2m !== 'number' ||
      typeof c.uv_index !== 'number'
    ) {
      return { weather: FALLBACK_WEATHER, usedFallback: true }
    }
    const weather = {
      tempF: c.temperature_2m,
      heatIndexF: c.apparent_temperature,
      humidity: c.relativehumidity_2m,
      uvIndex: c.uv_index,
    }
    return { weather, usedFallback: false }
  } catch {
    return { weather: FALLBACK_WEATHER, usedFallback: true }
  }
}

// ---------------------------------------------------------------------------
// Top-level recommendation
// ---------------------------------------------------------------------------

/**
 * Full recommendation: fetch weather → score → find nearest active fountains.
 */
export async function getHydrationRecommendation(
  userLat: number | null,
  userLng: number | null,
  willExercise: boolean,
  fountains: Fountain[],
  fetchImpl: typeof fetch = fetch,
): Promise<HydrationRecommendation> {
  const { weather, usedFallback } = await fetchAustinWeather(fetchImpl)
  const { cups, liters, reason, factors } = scoreHydration(weather, willExercise)

  let nearestFountains: HydrationRecommendation['nearestFountains'] = []
  if (userLat != null && userLng != null) {
    const active = (fountains || []).filter((f) => f.status === 'active')
    nearestFountains = nearest(userLat, userLng, active, 3)
  }

  return { cups, liters, reason, factors, weather, usedFallback, nearestFountains }
}
