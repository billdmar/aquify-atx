// ThemeToggle — a single button that flips light/dark mode.

import { useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-md p-2 text-aqua-50 transition-colors hover:bg-aqua-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <span aria-hidden="true" className="text-base">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  )
}
