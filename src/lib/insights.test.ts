import { describe, it, expect } from 'vitest'
import { computeInsights } from './insights'
import { makeFountain } from '../test/fixtures'

describe('computeInsights', () => {
  it('returns zeros for an empty list', () => {
    const i = computeInsights([])
    expect(i.total).toBe(0)
    expect(i.byType).toEqual({ fountain: 0, 'bottle-filler': 0, both: 0 })
    expect(i.byStatus).toEqual({ active: 0, unverified: 0, inactive: 0 })
    expect(i.accessibleCount).toBe(0)
    expect(i.accessiblePct).toBe(0)
  })

  it('counts per type and status', () => {
    const i = computeInsights([
      makeFountain({ id: 'a', type: 'fountain', status: 'active' }),
      makeFountain({ id: 'b', type: 'fountain', status: 'unverified' }),
      makeFountain({ id: 'c', type: 'bottle-filler', status: 'active' }),
      makeFountain({ id: 'd', type: 'both', status: 'inactive' }),
    ])
    expect(i.total).toBe(4)
    expect(i.byType).toEqual({ fountain: 2, 'bottle-filler': 1, both: 1 })
    expect(i.byStatus).toEqual({ active: 2, unverified: 1, inactive: 1 })
  })

  it('computes the accessible count and rounded percentage', () => {
    const i = computeInsights([
      makeFountain({ id: 'a', accessible: true }),
      makeFountain({ id: 'b', accessible: true }),
      makeFountain({ id: 'c', accessible: false }),
    ])
    expect(i.accessibleCount).toBe(2)
    // 2 / 3 = 66.67% → rounds to 67
    expect(i.accessiblePct).toBe(67)
  })

  it('reports 100% when every fountain is accessible', () => {
    const i = computeInsights([
      makeFountain({ id: 'a', accessible: true }),
      makeFountain({ id: 'b', accessible: true }),
    ])
    expect(i.accessiblePct).toBe(100)
  })
})
