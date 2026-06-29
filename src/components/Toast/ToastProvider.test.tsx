import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToast } from './toastContext'

function Consumer() {
  const { toast } = useToast()
  return (
    <button type="button" onClick={() => toast('Saved', { type: 'success' })}>
      fire
    </button>
  )
}

describe('ToastProvider', () => {
  it('shows a toast when a consumer fires one', () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    )
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'fire' }))
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('auto-dismisses the toast after the timeout', () => {
    vi.useFakeTimers()
    try {
      render(
        <ToastProvider>
          <Consumer />
        </ToastProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'fire' }))
      expect(screen.getByText('Saved')).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
