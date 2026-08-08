// Top navigation. Shows primary links plus auth-aware actions:
// logged-in users see their name + Sign Out; others see Login/Register.
//
// Responsive: at md+ the links sit inline; below md they collapse behind a
// hamburger button that toggles a panel.

import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isAdmin } from '../../lib/admin'
import ThemeToggle from '../ThemeToggle/ThemeToggle'

const linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition-colors'
const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `${linkBase} ${
    isActive
      ? 'bg-aqua-700 text-white'
      : 'text-aqua-50 hover:bg-aqua-700/60'
  }`

export default function NavBar() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // In demo mode signOut throws; ignore and just navigate home.
    }
    setMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  // The nav links + auth section, shared between the inline (md+) and
  // collapsed (mobile) layouts. `closeMenu` (wired as each link's onClick)
  // closes the mobile panel on navigation.
  const navContent = (
    <>
      <NavLink to="/" className={linkClass} end onClick={closeMenu}>
        Map
      </NavLink>
      <NavLink to="/recommend" className={linkClass} onClick={closeMenu}>
        Hydration
      </NavLink>
      <NavLink to="/submit" className={linkClass} onClick={closeMenu}>
        Add Fountain
      </NavLink>
      <NavLink to="/insights" className={linkClass} onClick={closeMenu}>
        Insights
      </NavLink>
      <NavLink to="/about" className={linkClass} onClick={closeMenu}>
        About
      </NavLink>
      {isAdmin(currentUser) && (
        <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
          Admin
        </NavLink>
      )}

      <ThemeToggle />

      {currentUser ? (
        <div className="flex items-center gap-2 pl-2">
          <Link
            to="/profile"
            onClick={closeMenu}
            className="max-w-[12rem] truncate text-sm font-medium text-aqua-50 hover:underline"
            title={currentUser.displayName || currentUser.email || undefined}
          >
            {currentUser.displayName || currentUser.email}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-aqua-700 transition-colors hover:bg-aqua-50"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 pl-2">
          <NavLink to="/login" className={linkClass} onClick={closeMenu}>
            Login
          </NavLink>
          <Link
            to="/register"
            onClick={closeMenu}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-aqua-700 transition-colors hover:bg-aqua-50"
          >
            Register
          </Link>
        </div>
      )}
    </>
  )

  return (
    <nav className="bg-aqua-600 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-white" onClick={closeMenu}>
          <span aria-hidden="true" className="text-2xl">
            💧
          </span>
          <span className="text-xl font-bold tracking-tight">Aquify ATX</span>
        </Link>

        {/* Inline layout at md+ */}
        <div className="hidden flex-wrap items-center gap-1 md:flex">
          {navContent}
        </div>

        {/* Hamburger toggle below md */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation menu"
          className="rounded-md p-2 text-white hover:bg-aqua-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Collapsible panel below md */}
      {menuOpen && (
        <div
          id="mobile-nav"
          className="flex flex-col items-start gap-1 border-t border-aqua-700/40 px-4 pb-3 pt-2 md:hidden"
        >
          {navContent}
        </div>
      )}
    </nav>
  )
}
