/**
 * api/hydrate.ts — Vercel Node serverless function (server-side Gemini proxy).
 *
 * Why this exists: Aquify ATX is a static Vite SPA. The Gemini API key must
 * NEVER ship in the public client bundle, so it lives only in this function's
 * environment (process.env.GEMINI_API_KEY, set in the Vercel project). The
 * browser calls POST /api/hydrate; this function calls Gemini and returns a
 * small, validated JSON payload.
 *
 * Contract:
 *   Request  (POST, JSON):
 *     { weather: { tempF, heatIndexF, uvIndex, humidity },
 *       willExercise: boolean,
 *       baselineCups: number }
 *   Response (always HTTP 200 unless method is wrong):
 *     success → { ok: true, cups: <number>, tip: <string>, source: 'gemini' }
 *     no key  → { ok: false, reason: 'no-key' }
 *     bad LLM → { ok: false, reason: 'parse' }
 *     error   → { ok: false, reason: 'error' }
 *
 * The client treats any { ok: false } (or a network error) as "AI unavailable"
 * and falls back to the deterministic rule-based engine — so this function
 * never needs to 500 on the AI path.
 */

// This module runs only in Vercel's Node serverless runtime. Declare the bits
// of the Node environment we use so the app's browser-targeted tsconfig (which
// intentionally omits @types/node) still type-checks it.
declare const process: { env: Record<string, string | undefined> }

// Minimal structural types for the Vercel Node request/response, so this
// function stays dependency-free (no @vercel/node import needed).
interface VercelRequest {
  method?: string
  body?: unknown
}
interface VercelResponse {
  setHeader: (name: string, value: string) => void
  status: (code: number) => VercelResponse
  json: (body: unknown) => VercelResponse
}

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Sane bounds for a daily water recommendation, in cups. Anything outside this
// range is treated as model garbage and rejected.
const MIN_CUPS = 6
const MAX_CUPS = 20

/**
 * Defensively parse the model's text response into { cups, tip }.
 *
 * Gemini frequently wraps JSON in ```json … ``` fences or adds prose, so we
 * strip fences, locate the first {...} block, and JSON.parse inside a try/catch.
 * Exported so it can be unit-tested without a live API call.
 *
 * @param text  raw text returned by the model
 * @returns the parsed cups/tip, or null if unparseable/invalid
 */
export function parseGeminiResponse(
  text: unknown,
): { cups: number; tip: string } | null {
  if (typeof text !== 'string') return null

  // Strip Markdown code fences (```json … ``` or ``` … ```).
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

  // If there is still surrounding prose, grab the first balanced-looking object.
  if (!cleaned.startsWith('{')) {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    cleaned = cleaned.slice(start, end + 1)
  }

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return null
  }

  if (parsed == null || typeof parsed !== 'object') return null

  const cups = Number(parsed.cups)
  const tip = parsed.tip

  if (!Number.isFinite(cups) || cups < MIN_CUPS || cups > MAX_CUPS) return null
  if (typeof tip !== 'string' || tip.trim().length === 0) return null

  // Round to a clean half-cup and cap tip length for safe display.
  return {
    cups: Math.round(cups * 2) / 2,
    tip: tip.trim().slice(0, 400),
  }
}

/** Build the prompt sent to Gemini from the request payload. */
function buildPrompt(body: Record<string, unknown>): string {
  const w = (
    body.weather && typeof body.weather === 'object' ? body.weather : {}
  ) as Record<string, unknown>
  const tempF = Number(w.tempF)
  const heatIndexF = Number(w.heatIndexF)
  const uvIndex = Number(w.uvIndex)
  const humidity = Number(w.humidity)
  const willExercise = Boolean(body.willExercise)
  const baselineCups = Number(body.baselineCups)

  return [
    'You are a hydration assistant for people in Austin, Texas.',
    'Given the current local conditions, recommend a daily water intake and a short tip.',
    '',
    'Current Austin conditions:',
    `- Temperature: ${Number.isFinite(tempF) ? Math.round(tempF) : 'unknown'} °F`,
    `- Heat index (feels like): ${Number.isFinite(heatIndexF) ? Math.round(heatIndexF) : 'unknown'} °F`,
    `- UV index: ${Number.isFinite(uvIndex) ? uvIndex : 'unknown'}`,
    `- Relative humidity: ${Number.isFinite(humidity) ? humidity : 'unknown'} %`,
    `- Plans to exercise today: ${willExercise ? 'yes' : 'no'}`,
    Number.isFinite(baselineCups)
      ? `- A rule-based baseline suggests about ${baselineCups} cups; use it as a sanity check.`
      : '',
    '',
    'Respond with STRICT JSON ONLY, no markdown, no code fences, in exactly this shape:',
    '{"cups": <number between 6 and 20>, "tip": "<a friendly, Austin-specific 1-2 sentence hydration tip>"}',
    'The "cups" value is total daily 8-oz cups of water. Keep the tip under 240 characters.',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Vercel serverless handler. */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, reason: 'method' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // No key configured → tell the client to fall back. Not an error.
    return res.status(200).json({ ok: false, reason: 'no-key' })
  }

  // Vercel parses JSON bodies automatically, but guard for string bodies too.
  let body: unknown = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  if (body == null || typeof body !== 'object') body = {}

  const prompt = buildPrompt(body as Record<string, unknown>)

  try {
    const geminiRes = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!geminiRes.ok) {
      return res.status(200).json({ ok: false, reason: 'error' })
    }

    const data = await geminiRes.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = parseGeminiResponse(text)

    if (!parsed) {
      return res.status(200).json({ ok: false, reason: 'parse' })
    }

    return res.status(200).json({
      ok: true,
      cups: parsed.cups,
      tip: parsed.tip,
      source: 'gemini',
    })
  } catch {
    // Network / unexpected error → graceful fallback signal.
    return res.status(200).json({ ok: false, reason: 'error' })
  }
}
