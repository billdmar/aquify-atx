/**
 * aiHydrate.test.js — Tests for the client-side Gemini proxy helper.
 *
 * Verifies the success path and that EVERY failure mode returns null so the
 * page falls back to the rule-based recommendation. fetch is injected/mocked.
 */

import { describe, it, expect, vi } from 'vitest'
import { getAiHydration } from './aiHydrate'

const PAYLOAD = {
  weather: { tempF: 95, heatIndexF: 99, uvIndex: 7, humidity: 45 },
  willExercise: true,
  baselineCups: 11,
}

/** Mock fetch resolving with a given JSON body and ok flag. */
function okFetch(body: unknown, { ok = true } = {}): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as typeof fetch
}

describe('getAiHydration — success', () => {
  it('returns parsed result on ok:true response', async () => {
    const fetchImpl = okFetch({ ok: true, cups: 12, tip: 'Stay hydrated!', source: 'gemini' })
    const out = await getAiHydration(PAYLOAD, fetchImpl)
    expect(out).toEqual({ cups: 12, tip: 'Stay hydrated!', source: 'gemini' })
  })

  it('POSTs JSON to /api/hydrate', async () => {
    const fetchImpl = okFetch({ ok: true, cups: 9, tip: 'Sip.', source: 'gemini' })
    await getAiHydration(PAYLOAD, fetchImpl)
    expect(fetchImpl).toHaveBeenCalledWith('/api/hydrate', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PAYLOAD),
    }))
  })

  it('defaults source to gemini when omitted', async () => {
    const out = await getAiHydration(PAYLOAD, okFetch({ ok: true, cups: 10, tip: 'Drink.' }))
    expect(out).not.toBeNull()
    expect(out!.source).toBe('gemini')
  })
})

describe('getAiHydration — falls back to null', () => {
  it('returns null when fetch rejects (network error)', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))
    expect(await getAiHydration(PAYLOAD, fetchImpl)).toBeNull()
  })

  it('returns null on non-OK HTTP status', async () => {
    expect(await getAiHydration(PAYLOAD, okFetch({}, { ok: false }))).toBeNull()
  })

  it('returns null when server signals ok:false (no-key)', async () => {
    expect(await getAiHydration(PAYLOAD, okFetch({ ok: false, reason: 'no-key' }))).toBeNull()
  })

  it('returns null when server signals ok:false (parse)', async () => {
    expect(await getAiHydration(PAYLOAD, okFetch({ ok: false, reason: 'parse' }))).toBeNull()
  })

  it('returns null when cups is not a number', async () => {
    expect(await getAiHydration(PAYLOAD, okFetch({ ok: true, cups: 'lots', tip: 'x' }))).toBeNull()
  })

  it('returns null when tip is missing', async () => {
    expect(await getAiHydration(PAYLOAD, okFetch({ ok: true, cups: 10 }))).toBeNull()
  })

  it('returns null when tip is empty', async () => {
    expect(await getAiHydration(PAYLOAD, okFetch({ ok: true, cups: 10, tip: '  ' }))).toBeNull()
  })

  it('returns null when fetch resolves to null/undefined (defensive guard)', async () => {
    expect(await getAiHydration(PAYLOAD, vi.fn().mockResolvedValue(null))).toBeNull()
    expect(await getAiHydration(PAYLOAD, vi.fn().mockResolvedValue(undefined))).toBeNull()
  })

  it('returns null when cups is non-finite (Infinity)', async () => {
    expect(
      await getAiHydration(PAYLOAD, okFetch({ ok: true, cups: Infinity, tip: 'x' })),
    ).toBeNull()
  })

  it('returns null when the JSON body itself is null', async () => {
    expect(await getAiHydration(PAYLOAD, okFetch(null))).toBeNull()
  })

  it('returns null when json() rejects', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError('bad json')),
    })
    expect(await getAiHydration(PAYLOAD, fetchImpl)).toBeNull()
  })
})
