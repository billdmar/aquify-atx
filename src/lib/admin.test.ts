import { describe, it, expect, afterEach, vi } from 'vitest'
import { getAdminEmails, isAdmin } from './admin'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getAdminEmails', () => {
  it('returns [] when VITE_ADMIN_EMAILS is unset', () => {
    // No env var set in the test environment by default.
    expect(getAdminEmails()).toEqual([])
  })

  it('returns [] when VITE_ADMIN_EMAILS is empty', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', '')
    expect(getAdminEmails()).toEqual([])
  })

  it('parses a single email', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin@example.com')
    expect(getAdminEmails()).toEqual(['admin@example.com'])
  })

  it('splits a comma-separated list', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'a@x.com,b@y.com')
    expect(getAdminEmails()).toEqual(['a@x.com', 'b@y.com'])
  })

  it('lowercases and trims each entry, dropping blanks', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', '  Admin@Example.COM , ,  Two@Y.com  ')
    expect(getAdminEmails()).toEqual(['admin@example.com', 'two@y.com'])
  })
})

describe('isAdmin', () => {
  it('returns false for a null user', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin@example.com')
    expect(isAdmin(null)).toBe(false)
  })

  it('returns false for a user without an email', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin@example.com')
    expect(isAdmin({ email: null })).toBe(false)
  })

  it('returns false when the allowlist is empty', () => {
    expect(isAdmin({ email: 'admin@example.com' })).toBe(false)
  })

  it('returns true for an allowlisted email', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin@example.com')
    expect(isAdmin({ email: 'admin@example.com' })).toBe(true)
  })

  it('matches case-insensitively', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin@example.com')
    expect(isAdmin({ email: 'Admin@Example.COM' })).toBe(true)
  })

  it('returns false for a non-allowlisted email', () => {
    vi.stubEnv('VITE_ADMIN_EMAILS', 'admin@example.com')
    expect(isAdmin({ email: 'other@example.com' })).toBe(false)
  })
})
