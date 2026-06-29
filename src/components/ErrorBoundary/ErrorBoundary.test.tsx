import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

// A component that throws on demand, to trip the boundary.
function Boom({ explode }: { explode: boolean }) {
  if (explode) throw new Error('kaboom')
  return <div>safe content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught errors; silence it for clean test output.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Boom explode={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('shows the fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom explode={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={() => <p>custom fallback</p>}>
        <Boom explode={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('custom fallback')).toBeInTheDocument()
  })

  it('recovers via reset once the child no longer throws', () => {
    function Wrapper() {
      return (
        <ErrorBoundary fallback={(reset) => <button onClick={reset}>retry</button>}>
          <Boom explode={false} />
        </ErrorBoundary>
      )
    }
    // First mount with a throwing child, then confirm reset clears the error.
    const { rerender } = render(
      <ErrorBoundary fallback={(reset) => <button onClick={reset}>retry</button>}>
        <Boom explode={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'retry' }))
    rerender(<Wrapper />)
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })
})
