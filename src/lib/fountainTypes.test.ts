import { describe, it, expect } from 'vitest'
import {
  typeLabel,
  typeBadgeClass,
  statusClass,
  statusDot,
} from './fountainTypes.js'

// ---------------------------------------------------------------------------
// typeLabel
// ---------------------------------------------------------------------------
describe('typeLabel', () => {
  it('maps each known FountainType to its human-readable label', () => {
    expect(typeLabel('fountain')).toBe('Drinking Fountain')
    expect(typeLabel('bottle-filler')).toBe('Bottle Filler')
    expect(typeLabel('both')).toBe('Fountain + Bottle Filler')
  })

  it('returns the input string itself for an unknown/garbage type', () => {
    expect(typeLabel('spigot')).toBe('spigot')
    expect(typeLabel('')).toBe('')
    expect(typeLabel('FOUNTAIN')).toBe('FOUNTAIN') // case-sensitive, not a key
  })
})

// ---------------------------------------------------------------------------
// typeBadgeClass
// ---------------------------------------------------------------------------
describe('typeBadgeClass', () => {
  it('maps each known FountainType to its badge classes', () => {
    expect(typeBadgeClass('fountain')).toBe('bg-blue-100 text-blue-800')
    expect(typeBadgeClass('bottle-filler')).toBe('bg-green-100 text-green-800')
    expect(typeBadgeClass('both')).toBe('bg-purple-100 text-purple-800')
  })

  it('returns the gray fallback badge class for an unknown type', () => {
    expect(typeBadgeClass('spigot')).toBe('bg-gray-100 text-gray-700')
    expect(typeBadgeClass('')).toBe('bg-gray-100 text-gray-700')
  })
})

// ---------------------------------------------------------------------------
// statusClass
// ---------------------------------------------------------------------------
describe('statusClass', () => {
  it('maps each known FountainStatus to its pill classes', () => {
    expect(statusClass('active')).toBe('bg-green-100 text-green-800')
    expect(statusClass('unverified')).toBe('bg-amber-100 text-amber-800')
    expect(statusClass('inactive')).toBe('bg-gray-100 text-gray-600')
  })

  it('falls back to the inactive pill class for an unknown status', () => {
    expect(statusClass('broken')).toBe('bg-gray-100 text-gray-600')
    expect(statusClass('')).toBe('bg-gray-100 text-gray-600')
  })
})

// ---------------------------------------------------------------------------
// statusDot
// ---------------------------------------------------------------------------
describe('statusDot', () => {
  it('maps each known FountainStatus to its dot colour', () => {
    expect(statusDot('active')).toBe('bg-green-500')
    expect(statusDot('unverified')).toBe('bg-amber-500')
    expect(statusDot('inactive')).toBe('bg-gray-400')
  })

  it('falls back to the inactive dot colour for an unknown status', () => {
    expect(statusDot('broken')).toBe('bg-gray-400')
    expect(statusDot('')).toBe('bg-gray-400')
  })
})
