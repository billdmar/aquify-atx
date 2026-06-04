import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReviewModal from './ReviewModal'

// Mock AuthContext so tests can control currentUser without Firebase
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock firestore so addReview never hits the network
vi.mock('../../lib/firestore', () => ({
  addReview: vi.fn(),
}))

import { useAuth } from '../../context/AuthContext'

const sampleFountain = {
  id: 'f1',
  name: 'Barton Springs Fountain',
}

describe('ReviewModal', () => {
  beforeEach(() => {
    // Default: no current user (demo/logged-out mode)
    useAuth.mockReturnValue({ currentUser: null })
  })

  it('renders nothing when fountain is null', () => {
    const { container } = render(
      <ReviewModal fountain={null} onClose={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when fountain is undefined', () => {
    const { container } = render(
      <ReviewModal fountain={undefined} onClose={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the dialog when fountain is provided', () => {
    render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has role="dialog" and aria-modal="true" when open', () => {
    render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('shows fountain name inside the dialog', () => {
    render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
    expect(screen.getByText('Barton Springs Fountain')).toBeInTheDocument()
  })

  it('shows "Please log in to leave a review." when no currentUser', () => {
    render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
    expect(
      screen.getByText('Please log in to leave a review.'),
    ).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<ReviewModal fountain={sampleFountain} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close review dialog/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<ReviewModal fountain={sampleFountain} onClose={onClose} />)
    // The backdrop is the outermost div; click it directly
    const backdrop = screen.getByRole('dialog').parentElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<ReviewModal fountain={sampleFountain} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does NOT call onClose when a non-Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<ReviewModal fountain={sampleFountain} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  describe('logged-in path', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        currentUser: { uid: 'user1', email: 'user@example.com' },
      })
    })

    it('shows the star rating buttons when logged in', () => {
      render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
      // Five star buttons with aria-labels
      expect(screen.getByRole('button', { name: /1 star/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /5 stars/i })).toBeInTheDocument()
    })

    it('shows the comment textarea when logged in', () => {
      render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
      expect(screen.getByLabelText(/comment/i)).toBeInTheDocument()
    })

    it('shows the Submit Review button when logged in', () => {
      render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
      expect(
        screen.getByRole('button', { name: /submit review/i }),
      ).toBeInTheDocument()
    })

    it('does NOT show the "please log in" message when logged in', () => {
      render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
      expect(
        screen.queryByText(/please log in/i),
      ).not.toBeInTheDocument()
    })

    it('shows validation errors when submitting without rating or comment', async () => {
      render(<ReviewModal fountain={sampleFountain} onClose={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: /submit review/i }))
      expect(
        await screen.findByText('Please select a star rating.'),
      ).toBeInTheDocument()
      expect(
        await screen.findByText('Comment is required.'),
      ).toBeInTheDocument()
    })
  })
})
