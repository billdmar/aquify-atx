import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useShare } from './useShare.js'

const sample = {
  title: 'Barton Springs Fountain',
  text: 'Check out this fountain',
  url: 'https://aquify.example/fountain/f1',
}

afterEach(() => {
  vi.restoreAllMocks()
  // Remove any per-test overrides so the next test starts clean.
  delete (navigator as { share?: unknown }).share
  delete (navigator as { clipboard?: unknown }).clipboard
})

describe('useShare', () => {
  it('calls navigator.share with the data when available', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      value: shareSpy,
      configurable: true,
    })

    const { result } = renderHook(() => useShare())

    await act(async () => {
      await result.current.share(sample)
    })

    expect(shareSpy).toHaveBeenCalledOnce()
    expect(shareSpy).toHaveBeenCalledWith(sample)
    // Native path never flips the clipboard flag.
    expect(result.current.justCopied).toBe(false)
  })

  it('swallows AbortError from a user-cancelled share (does not throw)', async () => {
    const shareSpy = vi
      .fn()
      .mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    Object.defineProperty(navigator, 'share', {
      value: shareSpy,
      configurable: true,
    })

    const { result } = renderHook(() => useShare())

    await expect(
      act(async () => {
        await result.current.share(sample)
      }),
    ).resolves.toBeUndefined()
    expect(result.current.justCopied).toBe(false)
  })

  it('re-throws non-AbortError failures from navigator.share', async () => {
    const shareSpy = vi.fn().mockRejectedValue(new Error('boom'))
    Object.defineProperty(navigator, 'share', {
      value: shareSpy,
      configurable: true,
    })

    const { result } = renderHook(() => useShare())

    await expect(result.current.share(sample)).rejects.toThrow('boom')
  })

  it('falls back to clipboard and flips justCopied when share is unavailable', async () => {
    // No navigator.share in this test (cleaned up by afterEach).
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const { result } = renderHook(() => useShare())

    await act(async () => {
      await result.current.share(sample)
    })

    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText).toHaveBeenCalledWith(sample.url)
    expect(result.current.justCopied).toBe(true)
  })

  it('resets justCopied after the timeout window', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const { result } = renderHook(() => useShare())

    await act(async () => {
      await result.current.share(sample)
    })
    expect(result.current.justCopied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.justCopied).toBe(false)

    vi.useRealTimers()
  })

  it('does nothing destructive when neither share nor clipboard exist', async () => {
    const { result } = renderHook(() => useShare())
    await expect(
      act(async () => {
        await result.current.share(sample)
      }),
    ).resolves.toBeUndefined()
    expect(result.current.justCopied).toBe(false)
  })

  it('keeps the native path stable across re-renders (waitFor sanity)', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      value: shareSpy,
      configurable: true,
    })
    const { result } = renderHook(() => useShare())
    await act(async () => {
      await result.current.share(sample)
    })
    await waitFor(() => expect(shareSpy).toHaveBeenCalledOnce())
  })
})
