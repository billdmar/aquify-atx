/**
 * hydrate.test.js — Unit tests for the defensive Gemini response parser.
 *
 * These cover the parsing/validation logic in api/hydrate.js without making
 * any live API call (the handler itself is exercised only via this pure helper).
 */

import { describe, it, expect } from 'vitest'
import { parseGeminiResponse } from './hydrate.js'

describe('parseGeminiResponse — happy path', () => {
  it('parses clean JSON', () => {
    const out = parseGeminiResponse('{"cups": 10, "tip": "Drink up, Austin!"}')
    expect(out).toEqual({ cups: 10, tip: 'Drink up, Austin!' })
  })

  it('strips ```json code fences', () => {
    const text = '```json\n{"cups": 9, "tip": "Stay cool by Lady Bird Lake."}\n```'
    expect(parseGeminiResponse(text)).toEqual({
      cups: 9,
      tip: 'Stay cool by Lady Bird Lake.',
    })
  })

  it('strips bare ``` fences', () => {
    const text = '```\n{"cups": 8, "tip": "Carry a bottle."}\n```'
    expect(parseGeminiResponse(text)).toEqual({ cups: 8, tip: 'Carry a bottle.' })
  })

  it('extracts JSON embedded in surrounding prose', () => {
    const text = 'Sure! Here you go: {"cups": 12, "tip": "Hydrate before SXSW crowds."} Hope that helps.'
    expect(parseGeminiResponse(text)).toEqual({
      cups: 12,
      tip: 'Hydrate before SXSW crowds.',
    })
  })

  it('coerces a numeric string cups value', () => {
    const out = parseGeminiResponse('{"cups": "11", "tip": "Sip often."}')
    expect(out).toEqual({ cups: 11, tip: 'Sip often.' })
  })

  it('rounds cups to the nearest half cup', () => {
    const out = parseGeminiResponse('{"cups": 9.7, "tip": "Drink more."}')
    expect(out).not.toBeNull()
    expect(out!.cups).toBe(9.5)
  })

  it('trims and caps an overly long tip', () => {
    const longTip = 'x'.repeat(500)
    const out = parseGeminiResponse(`{"cups": 8, "tip": "${longTip}"}`)
    expect(out).not.toBeNull()
    expect(out!.tip.length).toBe(400)
  })
})

describe('parseGeminiResponse — rejects garbage', () => {
  it('returns null for non-string input', () => {
    expect(parseGeminiResponse(null)).toBeNull()
    expect(parseGeminiResponse(undefined)).toBeNull()
    expect(parseGeminiResponse(42)).toBeNull()
  })

  it('returns null for unparseable text', () => {
    expect(parseGeminiResponse('not json at all')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parseGeminiResponse('{"cups": 10, "tip": }')).toBeNull()
  })

  it('returns null when cups is below the sane minimum', () => {
    expect(parseGeminiResponse('{"cups": 3, "tip": "Too low."}')).toBeNull()
  })

  it('returns null when cups exceeds the sane maximum', () => {
    expect(parseGeminiResponse('{"cups": 99, "tip": "Way too high."}')).toBeNull()
  })

  it('returns null when cups is not a number', () => {
    expect(parseGeminiResponse('{"cups": "lots", "tip": "Drink."}')).toBeNull()
  })

  it('returns null when tip is missing', () => {
    expect(parseGeminiResponse('{"cups": 10}')).toBeNull()
  })

  it('returns null when tip is empty/whitespace', () => {
    expect(parseGeminiResponse('{"cups": 10, "tip": "   "}')).toBeNull()
  })

  it('returns null for a JSON array', () => {
    expect(parseGeminiResponse('[1, 2, 3]')).toBeNull()
  })

  it('returns null when cups is Infinity', () => {
    // JSON.parse can't produce Infinity, but a non-finite Number() coercion
    // (e.g. via a string) must still be rejected, never returned.
    expect(parseGeminiResponse('{"cups": 1e400, "tip": "huge"}')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Boundary behaviour of the sane-cups range [MIN_CUPS=6, MAX_CUPS=20].
// The dev team should keep these green if they ever tune the bounds.
// ---------------------------------------------------------------------------
describe('parseGeminiResponse — cups range boundaries', () => {
  it('accepts the exact minimum (6 cups)', () => {
    expect(parseGeminiResponse('{"cups": 6, "tip": "Just enough."}')).toEqual({
      cups: 6,
      tip: 'Just enough.',
    })
  })

  it('accepts the exact maximum (20 cups)', () => {
    expect(parseGeminiResponse('{"cups": 20, "tip": "Plenty."}')).toEqual({
      cups: 20,
      tip: 'Plenty.',
    })
  })

  it('rejects just below the minimum (5.9 cups)', () => {
    expect(parseGeminiResponse('{"cups": 5.9, "tip": "Too little."}')).toBeNull()
  })

  it('rejects just above the maximum (20.1 cups)', () => {
    expect(parseGeminiResponse('{"cups": 20.1, "tip": "Too much."}')).toBeNull()
  })

  it('still produces a valid result and trims the tip at a boundary cup value', () => {
    const out = parseGeminiResponse('{"cups": 6, "tip": "  Sip slow.  "}')
    expect(out).toEqual({ cups: 6, tip: 'Sip slow.' })
  })
})
