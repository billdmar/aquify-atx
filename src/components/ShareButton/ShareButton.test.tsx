import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ShareButton from './ShareButton'

const props = {
  title: 'Barton Springs Fountain',
  text: 'Check out this fountain',
  url: 'https://aquify.example/fountain/f1',
}

afterEach(() => {
  vi.restoreAllMocks()
  delete (navigator as { share?: unknown }).share
  delete (navigator as { clipboard?: unknown }).clipboard
})

describe('ShareButton', () => {
  it('renders a labelled Share button by default', () => {
    render(<ShareButton {...props} />)
    const btn = screen.getByRole('button', { name: 'Share' })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent('Share')
  })

  it('uses a custom label when provided', () => {
    render(<ShareButton {...props} label="Share fountain" />)
    expect(
      screen.getByRole('button', { name: 'Share fountain' }),
    ).toBeInTheDocument()
  })

  it('calls navigator.share with the data on click', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      value: shareSpy,
      configurable: true,
    })

    render(<ShareButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => expect(shareSpy).toHaveBeenCalledOnce())
    expect(shareSpy).toHaveBeenCalledWith({
      title: props.title,
      text: props.text,
      url: props.url,
    })
  })

  it('falls back to clipboard and shows "Copied!" when share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<ShareButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() =>
      expect(screen.getByText('Copied!')).toBeInTheDocument(),
    )
    expect(writeText).toHaveBeenCalledWith(props.url)
  })

  it('does not throw when the user cancels the native share (AbortError)', async () => {
    const shareSpy = vi
      .fn()
      .mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    Object.defineProperty(navigator, 'share', {
      value: shareSpy,
      configurable: true,
    })

    render(<ShareButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() => expect(shareSpy).toHaveBeenCalledOnce())
    // The button stays in its default state — no crash, no "Copied!".
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
  })

  it('renders a real <button> with an accessible label and aria-live region', () => {
    render(<ShareButton {...props} />)
    const btn = screen.getByRole('button', { name: 'Share' })
    expect(btn.tagName).toBe('BUTTON')
    expect(btn).toHaveAttribute('aria-label', 'Share')
  })
})
