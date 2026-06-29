// Admin identity — a simple email allowlist read from a Vite env var.
//
// SECURITY: this allowlist is a CLIENT-SIDE UX gate ONLY. It hides the admin
// page and Approve/Reject controls from non-admins, but it is NOT a security
// boundary — anyone can edit the bundled JS or call Firestore directly. Real
// enforcement MUST live in firestore.rules (restrict submission status writes
// to admins). Do not treat isAdmin() as authorization.

/**
 * The configured admin emails (comma-separated VITE_ADMIN_EMAILS), normalised
 * to lowercase + trimmed. Empty entries are dropped. Returns [] when unset.
 */
export function getAdminEmails(): string[] {
  const raw = import.meta.env.VITE_ADMIN_EMAILS
  if (!raw) return []
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
}

/**
 * True when the user's email is on the allowlist (case-insensitive). False for
 * a null user, a user without an email, or an empty allowlist.
 */
export function isAdmin(user: { email: string | null } | null): boolean {
  if (!user?.email) return false
  return getAdminEmails().includes(user.email.trim().toLowerCase())
}
