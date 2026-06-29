import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ReviewList from './ReviewList'
import { makeReview } from '../../test/fixtures'

describe('ReviewList', () => {
  it('shows a loading message when loading is true', () => {
    render(<ReviewList reviews={[]} loading />)
    expect(screen.getByText('Loading reviews…')).toBeInTheDocument()
  })

  it('shows the empty state when there are no reviews', () => {
    render(<ReviewList reviews={[]} />)
    expect(screen.getByText('No reviews yet')).toBeInTheDocument()
    expect(
      screen.getByText('Be the first to review this fountain.'),
    ).toBeInTheDocument()
  })

  it('does not show the empty state while loading', () => {
    render(<ReviewList reviews={[]} loading />)
    expect(screen.queryByText('No reviews yet')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Be the first to review this fountain.'),
    ).not.toBeInTheDocument()
  })

  it('renders each review author name and comment', () => {
    const reviews = [
      makeReview({
        id: 'r1',
        authorName: 'Alice',
        comment: 'Cold and refreshing.',
        rating: 4,
      }),
      makeReview({
        id: 'r2',
        authorName: 'Bob',
        comment: 'Great pressure.',
        rating: 5,
      }),
    ]
    render(<ReviewList reviews={reviews} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Cold and refreshing.')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Great pressure.')).toBeInTheDocument()
  })

  it('shows the count and average for multiple reviews', () => {
    const reviews = [
      makeReview({ id: 'r1', rating: 4 }),
      makeReview({ id: 'r2', rating: 5 }),
    ]
    render(<ReviewList reviews={reviews} />)
    // Average of 4 and 5 is 4.5
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText(/2 reviews/)).toBeInTheDocument()
  })

  it('uses the singular "review" for a single review', () => {
    render(<ReviewList reviews={[makeReview({ id: 'r1', rating: 3 })]} />)
    expect(screen.getByText(/1 review/)).toBeInTheDocument()
    expect(screen.queryByText(/1 reviews/)).not.toBeInTheDocument()
  })

  it('falls back to "Anonymous" when a review has no author name', () => {
    render(
      <ReviewList
        reviews={[makeReview({ id: 'r1', authorName: '', comment: 'No name.' })]}
      />,
    )
    expect(screen.getByText('Anonymous')).toBeInTheDocument()
  })
})
