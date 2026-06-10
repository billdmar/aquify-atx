/**
 * Recommend.jsx — Hydration Recommendation page.
 *
 * Fetches live Austin weather, scores it with the rule-based hydroEngine,
 * and optionally shows the 3 nearest active water fountains.
 */

import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useFountains } from '../context/FountainContext'
import { getHydrationRecommendation } from '../recommend/hydroEngine'
import { getAiHydration } from '../recommend/aiHydrate'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WeatherStrip({ weather, usedFallback }) {
  return (
    <div className="rounded-xl border border-aqua-200 bg-aqua-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-aqua-800 uppercase tracking-wide">
          Current Conditions
        </h3>
        {usedFallback && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Using fallback averages
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-aqua-600">Temperature</dt>
          <dd className="text-lg font-bold text-aqua-900">{Math.round(weather.tempF)}°F</dd>
        </div>
        <div>
          <dt className="text-xs text-aqua-600">Heat Index</dt>
          <dd className="text-lg font-bold text-aqua-900">{Math.round(weather.heatIndexF)}°F</dd>
        </div>
        <div>
          <dt className="text-xs text-aqua-600">UV Index</dt>
          <dd className="text-lg font-bold text-aqua-900">{weather.uvIndex}</dd>
        </div>
        <div>
          <dt className="text-xs text-aqua-600">Humidity</dt>
          <dd className="text-lg font-bold text-aqua-900">{weather.humidity}%</dd>
        </div>
      </dl>
    </div>
  )
}

function FactorList({ factors }) {
  if (factors.length === 0) return null
  return (
    <ul className="mt-3 space-y-1">
      {factors.map((f) => (
        <li key={f.label} className="flex items-center gap-2 text-sm text-aqua-700">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-aqua-200 text-xs font-bold text-aqua-800">
            +{f.cups}
          </span>
          <span className="capitalize">{f.label}</span>
        </li>
      ))}
    </ul>
  )
}

function FountainCard({ fountain }) {
  const distText =
    typeof fountain.distanceMiles === 'number'
      ? `${fountain.distanceMiles.toFixed(2)} mi away`
      : ''

  return (
    <div className="flex items-start justify-between rounded-xl border border-aqua-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="truncate font-semibold text-aqua-900">{fountain.name}</p>
        {fountain.address && (
          <p className="mt-0.5 truncate text-xs text-aqua-600">{fountain.address}</p>
        )}
        {distText && (
          <p className="mt-1 text-xs font-medium text-aqua-500">{distText}</p>
        )}
      </div>
      <Link
        to={`/?focus=${fountain.id}`}
        className="ml-4 shrink-0 rounded-lg bg-aqua-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-aqua-700 transition-colors"
      >
        Take me there
      </Link>
    </div>
  )
}

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
      <span aria-hidden="true">✨</span>
      AI-powered (Gemini)
    </span>
  )
}

function AiTipCard({ ai }) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm ring-1 ring-violet-100">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <AiBadge />
        <span className="text-xs font-semibold text-violet-700">
          suggests {ai.cups} cups
        </span>
      </div>
      <p className="text-sm leading-relaxed text-violet-900">{ai.tip}</p>
    </div>
  )
}

/** Subtle skeleton shown while the best-effort Gemini call is in flight. */
function AiTipSkeleton() {
  return (
    <div
      className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm ring-1 ring-violet-100"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-center gap-2">
        <AiBadge />
        <span className="text-xs font-medium text-violet-400">thinking…</span>
      </div>
      <div className="space-y-2 animate-pulse">
        <div className="h-3 w-full rounded bg-violet-100" />
        <div className="h-3 w-11/12 rounded bg-violet-100" />
        <div className="h-3 w-3/4 rounded bg-violet-100" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Recommend() {
  const { fountains, loading: fountainsLoading } = useFountains()

  const [willExercise, setWillExercise] = useState(false)
  const [result, setResult] = useState(null)
  const [ai, setAi] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runRecommendation = useCallback(
    async (lat, lng) => {
      setLoading(true)
      setError(null)
      setAi(null)
      setAiLoading(false)
      try {
        const rec = await getHydrationRecommendation(lat, lng, willExercise, fountains)
        setResult(rec)

        // Best-effort AI enrichment. If the serverless Gemini proxy is
        // unavailable (no key, network error, bad response), getAiHydration
        // returns null and the rule-based result stands unchanged.
        setAiLoading(true)
        const aiResult = await getAiHydration({
          weather: rec.weather,
          willExercise,
          baselineCups: rec.cups,
        })
        if (aiResult) setAi(aiResult)
      } catch (err) {
        setError('Something went wrong calculating your recommendation. Please try again.')
        console.error(err)
      } finally {
        setLoading(false)
        setAiLoading(false)
      }
    },
    [willExercise, fountains],
  )

  const handleGetRecommendation = () => {
    setResult(null)
    setAi(null)
    setLocationDenied(false)
    setError(null)

    if (!navigator.geolocation) {
      runRecommendation(null, null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        runRecommendation(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setLocationDenied(true)
        runRecommendation(null, null)
      },
      { timeout: 8000 },
    )
  }

  const handleExerciseChange = (e) => {
    setWillExercise(e.target.checked)
    // If a result already exists, refresh it immediately with the new flag.
    if (result) {
      handleGetRecommendation()
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-aqua-900">
          Hydration Recommendation
        </h1>
        <p className="mt-2 text-aqua-600">
          Personalized water intake based on Austin&apos;s current weather.
        </p>
      </header>

      {/* Controls */}
      <section className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={willExercise}
            onChange={handleExerciseChange}
            className="h-4 w-4 accent-aqua-600"
          />
          <span className="text-sm font-medium text-aqua-800">
            I plan to exercise today
          </span>
        </label>

        <button
          type="button"
          onClick={handleGetRecommendation}
          disabled={loading || fountainsLoading}
          className="rounded-xl bg-aqua-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-aqua-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Calculating…' : 'Get My Recommendation'}
        </button>
      </section>

      {/* Location note */}
      {locationDenied && (
        <p className="mb-4 text-center text-sm text-amber-600">
          Location access is off — showing recommendation without nearest fountains.
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Big number */}
          <div className="rounded-2xl border border-aqua-300 bg-aqua-50 p-6 text-center shadow-sm">
            <p className="text-6xl font-extrabold text-aqua-700">{result.cups}</p>
            <p className="mt-1 text-lg font-semibold text-aqua-900">cups per day</p>
            <p className="text-sm text-aqua-600">{result.liters} liters</p>
            <p className="mt-3 text-sm text-aqua-700 leading-relaxed">{result.reason}</p>
            <FactorList factors={result.factors} />
          </div>

          {/* AI-powered tip. Shows a subtle skeleton while the best-effort
              Gemini call is in flight, then the tip if available — and
              degrades invisibly (renders nothing) when AI is unavailable. */}
          {ai ? <AiTipCard ai={ai} /> : aiLoading && <AiTipSkeleton />}

          {/* Weather strip */}
          <WeatherStrip weather={result.weather} usedFallback={result.usedFallback} />

          {/* Nearest fountains */}
          {result.nearestFountains.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-aqua-800">
                Nearest Water Sources
              </h2>
              <div className="space-y-3">
                {result.nearestFountains.map((fountain) => (
                  <FountainCard key={fountain.id} fountain={fountain} />
                ))}
              </div>
            </section>
          )}

          {/* Methodology note */}
          <p className="text-center text-xs text-aqua-500 italic leading-relaxed">
            This recommendation uses current Austin weather data from Open-Meteo and a
            rule-based model. It is not medical advice.
          </p>
        </div>
      )}
    </main>
  )
}
