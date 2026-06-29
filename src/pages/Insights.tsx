// Insights — at-a-glance stats over the fountain dataset: counts by type and
// status, plus the share that's ADA-accessible. Charts are dependency-free
// CSS bars (no charting lib) and accessible: every bar carries a text label
// and value, and the chart groups use role="img" with a summary aria-label.

import { useMemo } from 'react'
import { useFountains } from '../context/FountainContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { computeInsights } from '../lib/insights'
import { typeLabel } from '../lib/fountainTypes'
import type { FountainType, FountainStatus } from '../types'

const TYPE_ORDER: FountainType[] = ['fountain', 'bottle-filler', 'both']
const STATUS_ORDER: FountainStatus[] = ['active', 'unverified', 'inactive']
const STATUS_LABELS: Record<FountainStatus, string> = {
  active: 'Active',
  unverified: 'Unverified',
  inactive: 'Inactive',
}
const STATUS_BAR_COLORS: Record<FountainStatus, string> = {
  active: 'bg-green-500',
  unverified: 'bg-amber-500',
  inactive: 'bg-gray-400',
}

interface BarRow {
  key: string
  label: string
  value: number
  colorClass: string
}

/** A labelled horizontal bar chart; widths are relative to `max`. */
function BarChart({
  title,
  rows,
  max,
}: {
  title: string
  rows: BarRow[]
  max: number
}) {
  return (
    <div
      role="img"
      aria-label={`${title}: ${rows
        .map((r) => `${r.label} ${r.value}`)
        .join(', ')}`}
    >
      <h2 className="text-lg font-semibold text-aqua-700 dark:text-aqua-300">
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-2" aria-hidden="true">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-sm text-slate-700 dark:text-slate-300">
              {row.label}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-slate-100 dark:bg-slate-700">
              <div
                className={`h-full rounded ${row.colorClass}`}
                style={{ width: `${max === 0 ? 0 : (row.value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Insights() {
  useDocumentTitle('Insights')
  const { fountains, loading, error } = useFountains()
  const insights = useMemo(() => computeInsights(fountains), [fountains])

  const typeRows: BarRow[] = TYPE_ORDER.map((type) => ({
    key: type,
    label: typeLabel(type),
    value: insights.byType[type],
    colorClass: 'bg-aqua-500',
  }))
  const typeMax = Math.max(1, ...typeRows.map((r) => r.value))

  const statusRows: BarRow[] = STATUS_ORDER.map((status) => ({
    key: status,
    label: STATUS_LABELS[status],
    value: insights.byStatus[status],
    colorClass: STATUS_BAR_COLORS[status],
  }))
  const statusMax = Math.max(1, ...statusRows.map((r) => r.value))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-aqua-800 dark:text-slate-100">
        Fountain Insights
      </h1>
      <p className="mt-4 text-slate-700 dark:text-slate-300">
        A quick breakdown of the public water fountains in the Aquify ATX
        dataset — by facility type, operational status, and accessibility.
      </p>

      {loading && (
        <p role="status" className="mt-8 text-aqua-700 dark:text-aqua-300">
          Loading insights…
        </p>
      )}

      {error && (
        <div className="mt-8 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-red-800 dark:text-red-200">
          Failed to load fountains: {error.message}
        </div>
      )}

      {!loading && !error && insights.total === 0 && (
        <p className="mt-8 text-slate-500 dark:text-slate-400">
          No fountains to summarize yet.
        </p>
      )}

      {!loading && !error && insights.total > 0 && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-aqua-100 dark:bg-slate-700/40 px-4 py-5 text-center">
              <div className="text-3xl font-bold text-aqua-800 dark:text-aqua-200 tabular-nums">
                {insights.total}
              </div>
              <div className="mt-1 text-sm text-aqua-800 dark:text-aqua-200">
                Total fountains
              </div>
            </div>
            <div className="rounded-xl bg-aqua-100 dark:bg-slate-700/40 px-4 py-5 text-center">
              <div className="text-3xl font-bold text-aqua-800 dark:text-aqua-200 tabular-nums">
                {insights.accessiblePct}%
              </div>
              <div className="mt-1 text-sm text-aqua-800 dark:text-aqua-200">
                ADA-accessible
              </div>
            </div>
            <div className="rounded-xl bg-aqua-100 dark:bg-slate-700/40 px-4 py-5 text-center">
              <div className="text-3xl font-bold text-aqua-800 dark:text-aqua-200 tabular-nums">
                {insights.byStatus.active}
              </div>
              <div className="mt-1 text-sm text-aqua-800 dark:text-aqua-200">
                Active now
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-10">
            <BarChart title="By facility type" rows={typeRows} max={typeMax} />
            <BarChart title="By status" rows={statusRows} max={statusMax} />
          </div>
        </>
      )}
    </div>
  )
}
