// Top navigation. Shows primary links plus auth-aware actions:
// logged-in users see their name + Sign Out; others see Login/Register.

import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition-colors'
const linkClass = ({ isActive }) =>
  `${linkBase} ${
    isActive
      ? 'bg-aqua-700 text-white'
      : 'text-aqua-50 hover:bg-aqua-700/60'
  }`

export default function NavBar() {
  const { currentUser, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // In demo mode signOut throws; ignore and just navigate home.
    }
    navigate('/')
  }

  return (
    <nav className="bg-aqua-600 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span aria-hidden="true" className="text-2xl">
            💧
          </span>
          <span className="text-xl font-bold tracking-tight">Aquify ATX</span>
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            Map
          </NavLink>
          <NavLink to="/recommend" className={linkClass}>
            Hydration
          </NavLink>
          <NavLink to="/submit" className={linkClass}>
            Add Fountain
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2">
              <Link
                to="/profile"
                className="max-w-[12rem] truncate text-sm font-medium text-aqua-50 hover:underline"
                title={currentUser.displayName || currentUser.email}
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
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <Link
                to="/register"
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-aqua-700 transition-colors hover:bg-aqua-50"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
