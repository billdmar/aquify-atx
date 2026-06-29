// insights.ts — pure aggregation over the fountain dataset for the Insights
// page. Kept free of React so the math is trivially unit-testable; the page
// just renders what computeInsights returns.

import type { Fountain, FountainType, FountainStatus } from '../types'

export interface FountainInsights {
  total: number
  byType: Record<FountainType, number>
  byStatus: Record<FountainStatus, number>
  accessibleCount: number
  /** Percent of fountains flagged ADA-accessible, rounded to a whole number. */
  accessiblePct: number
}

/** Aggregate counts/percentages from a list of fountains. */
export function computeInsights(fountains: Fountain[]): FountainInsights {
  const byType: Record<FountainType, number> = {
    fountain: 0,
    'bottle-filler': 0,
    both: 0,
  }
  const byStatus: Record<FountainStatus, number> = {
    active: 0,
    unverified: 0,
    inactive: 0,
  }
  let accessibleCount = 0

  for (const f of fountains) {
    byType[f.type] += 1
    byStatus[f.status] += 1
    if (f.accessible) accessibleCount += 1
  }

  const total = fountains.length
  const accessiblePct = total === 0 ? 0 : Math.round((accessibleCount / total) * 100)

  return { total, byType, byStatus, accessibleCount, accessiblePct }
}
