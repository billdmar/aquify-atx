import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FilterBar from './FilterBar'
import type { FilterState, FountainType } from '../../types'

const defaultFilters: FilterState = {
  search: '',
  types: new Set<FountainType>(['fountain', 'bottle-filler', 'both']),
  activeOnly: false,
  accessibleOnly: false,
  radiusMiles: null,
}

describe('FilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the search input', () => {
    render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/search by name or address/i)).toBeInTheDocument()
  })

  it('renders type checkboxes for all three types', () => {
    render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />)
    // Use exact label text to avoid "Bottle Filler" matching inside "Fountain + Bottle Filler"
    expect(screen.getByLabelText('Drinking Fountain')).toBeInTheDocument()
    expect(screen.getByLabelText('Bottle Filler')).toBeInTheDocument()
    expect(screen.getByLabelText('Fountain + Bottle Filler')).toBeInTheDocument()
  })

  it('renders the active-only toggle', () => {
    render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/active locations only/i)).toBeInTheDocument()
  })

  it('renders the accessible-only toggle', () => {
    render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/ada accessible only/i)).toBeInTheDocument()
  })

  it('toggling "active only" calls onChange with activeOnly:true', () => {
    const onChange = vi.fn()
    render(<FilterBar filters={defaultFilters} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/active locations only/i))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ activeOnly: true }),
    )
  })

  it('toggling "accessible only" calls onChange with accessibleOnly:true', () => {
    const onChange = vi.fn()
    render(<FilterBar filters={defaultFilters} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/ada accessible only/i))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ accessibleOnly: true }),
    )
  })

  it('toggling an already-active toggle flips it off', () => {
    const onChange = vi.fn()
    render(
      <FilterBar
        filters={{ ...defaultFilters, activeOnly: true }}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText(/active locations only/i))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ activeOnly: false }),
    )
  })

  it('typing in search calls onChange after the 300ms debounce', () => {
    const onChange = vi.fn()
    render(<FilterBar filters={defaultFilters} onChange={onChange} />)
    const input = screen.getByLabelText(/search by name or address/i)

    fireEvent.change(input, { target: { value: 'Barton' } })
    // Should NOT have fired yet
    expect(onChange).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Barton' }),
    )
  })

  it('debounce only fires once for rapid keystrokes', () => {
    const onChange = vi.fn()
    render(<FilterBar filters={defaultFilters} onChange={onChange} />)
    const input = screen.getByLabelText(/search by name or address/i)

    fireEvent.change(input, { target: { value: 'B' } })
    fireEvent.change(input, { target: { value: 'Ba' } })
    fireEvent.change(input, { target: { value: 'Bar' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })
    // Only one call — the last value
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Bar' }),
    )
  })

  it('radius slider is disabled when locationKnown=false', () => {
    render(
      <FilterBar filters={defaultFilters} onChange={vi.fn()} locationKnown={false} />,
    )
    const slider = screen.getByRole('slider', { name: /radius in miles/i })
    expect(slider).toBeDisabled()
  })

  it('radius slider is enabled when locationKnown=true', () => {
    render(
      <FilterBar filters={defaultFilters} onChange={vi.fn()} locationKnown={true} />,
    )
    const slider = screen.getByRole('slider', { name: /radius in miles/i })
    expect(slider).not.toBeDisabled()
  })

  it('handles filters.types as a Set containing "fountain"', () => {
    render(
      <FilterBar
        filters={{ ...defaultFilters, types: new Set<FountainType>(['fountain']) }}
        onChange={vi.fn()}
      />,
    )
    // Use exact label strings to avoid "Bottle Filler" matching inside "Fountain + Bottle Filler"
    expect(screen.getByLabelText('Drinking Fountain')).toBeChecked()
    expect(screen.getByLabelText('Bottle Filler')).not.toBeChecked()
  })

  it('handles filters.types as a single-element Set', () => {
    render(
      <FilterBar
        filters={{ ...defaultFilters, types: new Set<FountainType>(['fountain']) }}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Drinking Fountain')).toBeChecked()
    expect(screen.getByLabelText('Bottle Filler')).not.toBeChecked()
  })

  it('toggling a type checkbox calls onChange with updated types Set', () => {
    const onChange = vi.fn()
    render(
      <FilterBar
        filters={{ ...defaultFilters, types: new Set<FountainType>(['fountain']) }}
        onChange={onChange}
      />,
    )
    // Click the "Bottle Filler" checkbox (exact label to avoid matching "Fountain + Bottle Filler")
    fireEvent.click(screen.getByLabelText('Bottle Filler'))
    expect(onChange).toHaveBeenCalledOnce()
    const calledWith = onChange.mock.calls[0][0]
    expect(calledWith.types instanceof Set).toBe(true)
    expect(calledWith.types.has('bottle-filler')).toBe(true)
    expect(calledWith.types.has('fountain')).toBe(true)
  })

  it('shows the "enable location" hint when locationKnown is false', () => {
    render(
      <FilterBar filters={defaultFilters} onChange={vi.fn()} locationKnown={false} />,
    )
    expect(screen.getByText(/enable location to use/i)).toBeInTheDocument()
  })

  it('Clear all filters resets state and calls onChange with empty filters', () => {
    const onChange = vi.fn()
    render(
      <FilterBar
        filters={{ ...defaultFilters, activeOnly: true, search: 'test' }}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /clear all filters/i }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: '',
        activeOnly: false,
        accessibleOnly: false,
        radiusMiles: null,
      }),
    )
  })
})
