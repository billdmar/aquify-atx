/**
 * hydroEngine.js — Rule-based hydration recommendation engine for Austin, TX.
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUSTIN_LATLNG = { lat: 30.2672, lng: -97.7431 }

/** Documented Austin warm-season averages used when live weather is unavailable. */
export const FALLBACK_WEATHER = {
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
 *
 * @param {{ tempF: number, heatIndexF: number, uvIndex: number, humidity: number }} weather
 * @param {boolean} willExercise
 * @returns {{ cups: number, liters: number, reason: string, factors: Array<{label: string, cups: number}> }}
 */
export function scoreHydration(weather, willExercise) {
  const { tempF, heatIndexF, uvIndex, humidity } = weather
  const factors = []

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

/**
 * Fetch current Austin weather from Open-Meteo.
 * On any failure returns FALLBACK_WEATHER with usedFallback:true.
 *
 * @param {typeof fetch} fetchImpl  — injectable fetch implementation
 * @returns {Promise<{ weather: object, usedFallback: boolean }>}
 */
export async function fetchAustinWeather(fetchImpl = fetch) {
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
 *
 * @param {number|null} userLat
 * @param {number|null} userLng
 * @param {boolean} willExercise
 * @param {Array<object>} fountains  — full fountain list from FountainContext
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{
 *   cups: number,
 *   liters: number,
 *   reason: string,
 *   factors: Array<{label: string, cups: number}>,
 *   weather: object,
 *   usedFallback: boolean,
 *   nearestFountains: Array<object>
 * }>}
 */
export async function getHydrationRecommendation(
  userLat,
  userLng,
  willExercise,
  fountains,
  fetchImpl = fetch,
) {
  const { weather, usedFallback } = await fetchAustinWeather(fetchImpl)
  const { cups, liters, reason, factors } = scoreHydration(weather, willExercise)

  let nearestFountains = []
  if (userLat != null && userLng != null) {
    const active = (fountains || []).filter((f) => f.status === 'active')
    nearestFountains = nearest(userLat, userLng, active, 3)
  }

  return { cups, liters, reason, factors, weather, usedFallback, nearestFountains }
}
