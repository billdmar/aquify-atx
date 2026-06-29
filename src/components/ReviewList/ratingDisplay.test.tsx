import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { averageRating, RatingSummary } from './ratingDisplay'
import { makeReview } from '../../test/fixtures'

describe('averageRating', () => {
  it('returns null for an empty list', () => {
    expect(averageRating([])).toBeNull()
  })

  it('averages the ratings', () => {
    const reviews = [
      makeReview({ id: 'r1', rating: 4 }),
      makeReview({ id: 'r2', rating: 5 }),
    ]
    expect(averageRating(reviews)).toBe(4.5)
  })

  it('treats a non-numeric rating as 0', () => {
    const reviews = [
      makeReview({ id: 'r1', rating: 4 }),
      makeReview({ id: 'r2', rating: Number.NaN }),
    ]
    expect(averageRating(reviews)).toBe(2)
  })
})

describe('RatingSummary', () => {
  it('renders the rating to one decimal and the count', () => {
    render(<RatingSummary rating={4.5} count={12} />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('· 12')).toBeInTheDocument()
  })

  it('has an accessible label describing the rating and count', () => {
    render(<RatingSummary rating={3} count={1} />)
    expect(
      screen.getByLabelText('3.0 out of 5 stars from 1 review'),
    ).toBeInTheDocument()
  })
})
