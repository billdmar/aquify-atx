import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerWithEmail, mapAuthError } from '../lib/auth'
import { ensureUserProfile } from '../lib/firestore'
import { useAuth } from '../context/AuthContext'

type RegisterErrors = {
  displayName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function Register() {
  const { firebaseReady } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [pending, setPending] = useState(false)

  function validate() {
    const e: RegisterErrors = {}
    if (!displayName.trim()) {
      e.displayName = 'Display name is required.'
    }
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
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password.'
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match.'
    }
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSubmitError('')
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setErrors({})
    setPending(true)
    try {
      const user = await registerWithEmail(email.trim(), password, displayName.trim())
      await ensureUserProfile(user)
      navigate('/')
    } catch (err) {
      setSubmitError(mapAuthError(err))
    } finally {
      setPending(false)
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
            CREATE ACCOUNT
          </h1>
          <p className="text-sm text-slate-500 mt-1">Join Aquify ATX</p>
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
          {/* Display Name */}
          <div>
            <label htmlFor="reg-displayname" className="block text-sm font-medium text-slate-700 mb-1">
              Display Name
            </label>
            <input
              id="reg-displayname"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setDisplayName(ev.target.value)}
              aria-describedby={errors.displayName ? 'reg-displayname-error' : undefined}
              aria-invalid={!!errors.displayName}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${
                errors.displayName ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.displayName && (
              <p id="reg-displayname-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.displayName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEmail(ev.target.value)}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
              aria-invalid={!!errors.email}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${
                errors.email ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.email && (
              <p id="reg-email-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setPassword(ev.target.value)}
              aria-describedby={errors.password ? 'reg-password-error' : undefined}
              aria-invalid={!!errors.password}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${
                errors.password ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.password && (
              <p id="reg-password-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(ev.target.value)}
              aria-describedby={errors.confirmPassword ? 'reg-confirm-password-error' : undefined}
              aria-invalid={!!errors.confirmPassword}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500 ${
                errors.confirmPassword ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.confirmPassword && (
              <p id="reg-confirm-password-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-aqua-600 py-2.5 text-sm font-semibold text-white hover:bg-aqua-700 focus:outline-none focus:ring-2 focus:ring-aqua-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-aqua-600 hover:text-aqua-800 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
