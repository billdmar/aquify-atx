/**
 * aiHydrate.ts — Client helper that calls the server-side Gemini proxy.
 *
 * The browser never sees the Gemini API key; it only POSTs to /api/hydrate
 * (a Vercel serverless function). This helper is intentionally forgiving:
 * on ANY failure — no key, network error, non-OK status, malformed body, or
 * the server signalling { ok: false } — it returns null so callers fall back
 * to the deterministic rule-based recommendation.
 */

import type { Weather } from '../types'

export interface AiHydratePayload {
  weather: Weather
  willExercise: boolean
  baselineCups: number
}

export interface AiHydration {
  cups: number
  tip: string
  source: string
}

export async function getAiHydration(
  payload: AiHydratePayload,
  fetchImpl: typeof fetch = fetch,
): Promise<AiHydration | null> {
  try {
    const res = await fetchImpl('/api/hydrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res || !res.ok) return null

    const data = await res.json()
    if (!data || data.ok !== true) return null

    const cups = Number(data.cups)
    if (!Number.isFinite(cups)) return null
    if (typeof data.tip !== 'string' || data.tip.trim().length === 0) return null

    return { cups, tip: data.tip, source: data.source || 'gemini' }
  } catch {
    return null
  }
}
