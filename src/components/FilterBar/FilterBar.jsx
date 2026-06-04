// FilterBar.jsx — Controlled filter panel with debounced search.
// Collapses to an expandable panel on mobile.

import { useState, useEffect, useRef } from 'react'

const TYPES = [
  { value: 'fountain', label: 'Drinking Fountain' },
  { value: 'bottle-filler', label: 'Bottle Filler' },
  { value: 'both', label: 'Fountain + Bottle Filler' },
]

const RADIUS_OPTIONS = [0.5, 1, 2, 5]

/**
 * @param {{
 *   filters: {
 *     search: string,
 *     types: Set|string[],
 *     activeOnly: boolean,
 *     accessibleOnly: boolean,
 *     radiusMiles: number|null,
 *   },
 *   onChange: (nextFilters: object) => void,
 *   locationKnown?: boolean,
 * }} props
 */
export default function FilterBar({ filters, onChange, locationKnown = false }) {
  const [open, setOpen] = useState(false)
  // searchInput is the debounced local value for the text field.
  // It stays in sync with filters.search on initial render; "Clear all" resets
  // both the upstream state and the local state together via handleClearAll.
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const debounceRef = useRef(null)

  // Cleanup debounce timer on unmount only.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleSearchChange(e) {
    const value = e.target.value
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, search: value })
    }, 300)
  }

  function handleTypeToggle(typeValue) {
    const current = new Set(filters.types)
    if (current.has(typeValue)) {
      current.delete(typeValue)
    } else {
      current.add(typeValue)
    }
    onChange({ ...filters, types: current })
  }

  function handleToggle(field) {
    onChange({ ...filters, [field]: !filters[field] })
  }

  function handleRadiusChange(e) {
    if (!locationKnown) return
    const idx = Number(e.target.value)
    onChange({ ...filters, radiusMiles: RADIUS_OPTIONS[idx] })
  }

  function handleClearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchInput('')
    onChange({
      search: '',
      types: new Set(['fountain', 'bottle-filler', 'both']),
      activeOnly: false,
      accessibleOnly: false,
      radiusMiles: null,
    })
  }

  const activeTypesSet =
    filters.types instanceof Set ? filters.types : new Set(filters.types ?? [])

  const radiusIndex =
    filters.radiusMiles != null
      ? Math.max(0, RADIUS_OPTIONS.indexOf(Number(filters.radiusMiles)))
      : 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Mobile toggle */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        <span className="font-semibold text-sm text-gray-700">Filters</span>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="filter-panel"
          onClick={() => setOpen((v) => !v)}
          className="text-aqua-600 text-sm font-medium hover:text-aqua-800 transition-colors"
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Filter panel — always visible on md+, toggleable on mobile */}
      <div
        id="filter-panel"
        className={`px-4 pb-4 pt-0 md:pt-4 flex flex-col gap-4 md:flex ${open ? 'flex' : 'hidden'}`}
      >
        {/* Search */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-search" className="text-xs font-medium text-gray-600">
            Search by name or address
          </label>
          <input
            id="filter-search"
            type="search"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="e.g. Barton Springs…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aqua-400 bg-white"
          />
        </div>

        {/* Type checkboxes */}
        <fieldset>
          <legend className="text-xs font-medium text-gray-600 mb-1">
            Facility type
          </legend>
          <div className="flex flex-col gap-1.5">
            {TYPES.map(({ value, label }) => (
              <label key={value} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeTypesSet.has(value)}
                  onChange={() => handleTypeToggle(value)}
                  className="w-4 h-4 accent-aqua-600"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Toggles */}
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.activeOnly ?? false}
              onChange={() => handleToggle('activeOnly')}
              className="w-4 h-4 accent-aqua-600"
            />
            <span className="text-sm text-gray-700">Active locations only</span>
          </label>

          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.accessibleOnly ?? false}
              onChange={() => handleToggle('accessibleOnly')}
              className="w-4 h-4 accent-aqua-600"
            />
            <span className="text-sm text-gray-700">
              <span aria-label="ADA accessible">♿</span> ADA accessible only
            </span>
          </label>
        </div>

        {/* Radius slider */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="filter-radius"
            className="text-xs font-medium text-gray-600 flex items-center gap-2"
          >
            <span>Radius from my location</span>
            {!locationKnown && (
              <span className="text-gray-400 font-normal">(enable location to use)</span>
            )}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="filter-radius"
              type="range"
              min="0"
              max="3"
              step="1"
              disabled={!locationKnown}
              value={radiusIndex}
              onChange={handleRadiusChange}
              className="flex-1 accent-aqua-600 disabled:opacity-40"
              aria-label="Radius in miles"
            />
            <span
              className={`text-sm font-medium w-12 text-right ${locationKnown ? 'text-aqua-700' : 'text-gray-400'}`}
            >
              {filters.radiusMiles != null ? `${filters.radiusMiles} mi` : 'Any'}
            </span>
          </div>
          {/* Tick labels */}
          <div
            className="flex justify-between text-xs text-gray-400 px-0.5"
            aria-hidden="true"
          >
            {RADIUS_OPTIONS.map((r) => (
              <span key={r}>{r} mi</span>
            ))}
          </div>
        </div>

        {/* Clear all */}
        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs text-gray-400 hover:text-aqua-600 underline text-left w-fit transition-colors"
        >
          Clear all filters
        </button>
      </div>
    </div>
  )
}
