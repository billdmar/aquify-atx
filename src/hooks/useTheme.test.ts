import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme.js'

const STORAGE_KEY = 'aquify:theme'

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('useTheme', () => {
  it('defaults to the stored theme when localStorage has "dark"', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    // The mount effect should apply the `dark` class.
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('defaults to the stored theme when localStorage has "light"', () => {
    window.localStorage.setItem(STORAGE_KEY, 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('falls back to light when nothing is stored (matchMedia stub returns matches:false)', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('toggle() flips light -> dark and adds the dark class', () => {
    window.localStorage.setItem(STORAGE_KEY, 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.toggle()
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggle() flips dark -> light and removes the dark class', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark')
    const { result } = renderHook(() => useTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists the theme to localStorage under the "aquify:theme" key', () => {
    window.localStorage.setItem(STORAGE_KEY, 'light')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggle()
    })

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark')

    act(() => {
      result.current.toggle()
    })

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('light')
  })
})
