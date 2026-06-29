// ErrorBoundary — catches render-time errors anywhere in the tree below it and
// shows a friendly recovery UI instead of a white screen. React only supports
// error boundaries as class components.

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback; receives a reset callback. */
  fallback?: (reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface for debugging; in a real deployment this is where an error
    // reporter (Sentry, etc.) would be called.
    console.error('Uncaught error in component tree:', error, info)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(this.reset)

    return (
      <div
        role="alert"
        className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <span className="text-5xl" aria-hidden="true">
          💧
        </span>
        <h1 className="text-2xl font-bold text-aqua-800 dark:text-slate-100">
          Something went wrong
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          An unexpected error broke this view. You can try again, or head back to
          the map.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={this.reset}
            className="rounded-lg bg-aqua-600 px-4 py-2 text-sm font-semibold text-white hover:bg-aqua-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-aqua-300 px-4 py-2 text-sm font-semibold text-aqua-700 hover:bg-aqua-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/40"
          >
            Back to map
          </a>
        </div>
      </div>
    )
  }
}
