import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmail, signInWithGoogle } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { firebaseReady } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)

  function validate() {
    const e = {}
    if (!email.trim()) {
      e.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Enter a valid email address.'
    }
    if (!password) {
      e.password = 'Password is required.'
    } else if (password.length < 6) {
      e.password = 'Password must be at least 6 characters.'
    }
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    const e2 = validate()
    if (Object.keys(e2).length) {
      setErrors(e2)
      return
    }
    setErrors({})
    setPending(true)
    try {
      await signInWithEmail(email.trim(), password)
      navigate('/')
    } catch (err) {
      setSubmitError(err.message || 'Sign in failed. Please try again.')
    } finally {
      setPending(false)
    }
  }

  async function handleGoogle() {
    setSubmitError('')
    setGooglePending(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      setSubmitError(err.message || 'Google sign in failed. Please try again.')
    } finally {
      setGooglePending(false)
    }
  }

  return (
    <div className="min-h-screen bg-aqua-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-aqua-600 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              className="w-8 h-8"
              aria-hidden="true"
            >
              <path d="M12 2C9.5 6 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-4.5-8-7-12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-aqua-900 tracking-wide">
            SIGN IN
          </h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back to Aquify ATX</p>
        </div>

        {/* Demo-mode banner */}
        {!firebaseReady && (
          <div
            role="status"
            className="mb-5 rounded-lg bg-aqua-50 border border-aqua-200 px-4 py-3 text-sm text-aqua-800"
          >
            Demo mode: configure Firebase in <code className="font-mono">.env</code> to enable accounts.
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div role="alert" className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              aria-invalid={!!errors.email}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${
                errors.email ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.email && (
              <p id="login-email-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              aria-invalid={!!errors.password}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${
                errors.password ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.password && (
              <p id="login-password-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-aqua-600 py-2.5 text-sm font-semibold text-white hover:bg-aqua-700 focus:outline-none focus:ring-2 focus:ring-aqua-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-xs text-slate-400 uppercase tracking-wider">or</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googlePending}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-aqua-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googlePending ? 'Redirecting…' : 'Sign in with Google'}
        </button>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-aqua-600 hover:text-aqua-800 underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
