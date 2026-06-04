import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { addReview } from '../../lib/firestore'

const MAX_COMMENT = 500

export default function ReviewModal({ fountain, onClose }) {
  const { currentUser } = useAuth()

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)

  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Focus the dialog on open
  useEffect(() => {
    if (fountain && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [fountain])

  const handleClose = useCallback(() => {
    setRating(0)
    setHovered(0)
    setComment('')
    setErrors({})
    setSubmitError('')
    setPending(false)
    setSuccess(false)
    onClose()
  }, [onClose])

  // Escape key handler
  useEffect(() => {
    function onKeyDown(ev) {
      if (ev.key === 'Escape') handleClose()
    }
    if (fountain) {
      document.addEventListener('keydown', onKeyDown)
    }
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [fountain, handleClose])

  // Trap focus within the modal
  useEffect(() => {
    if (!fountain || !dialogRef.current) return
    const dialog = dialogRef.current
    const focusable = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    function trap(ev) {
      if (ev.key !== 'Tab') return
      if (focusable.length === 0) {
        ev.preventDefault()
        return
      }
      if (ev.shiftKey) {
        if (document.activeElement === first) {
          ev.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          ev.preventDefault()
          first.focus()
        }
      }
    }
    dialog.addEventListener('keydown', trap)
    return () => dialog.removeEventListener('keydown', trap)
  }, [fountain, success])

  if (!fountain) return null

  function validate() {
    const e = {}
    if (!rating) e.rating = 'Please select a star rating.'
    if (!comment.trim()) e.comment = 'Comment is required.'
    return e
  }

  async function handleSubmit(ev) {
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
      await addReview(fountain.id, { rating, comment: comment.trim() }, currentUser)
      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err) {
      setSubmitError(err.message || 'Could not submit review. Please try again.')
    } finally {
      setPending(false)
    }
  }

  const displayRating = hovered || rating

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) handleClose()
      }}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-7 outline-none"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label="Close review dialog"
          className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-aqua-500 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <h2
          id="review-modal-title"
          className="text-lg font-bold text-aqua-900 mb-1 pr-8"
        >
          Review Fountain
        </h2>
        <p className="text-sm text-slate-500 mb-5 truncate">{fountain.name}</p>

        {/* Not logged in */}
        {!currentUser && (
          <div role="status" className="rounded-lg bg-aqua-50 border border-aqua-200 px-4 py-3 text-sm text-aqua-800">
            Please log in to leave a review.
          </div>
        )}

        {/* Success */}
        {success && (
          <div role="status" className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 text-center text-sm font-medium text-green-700">
            Review submitted! Thank you.
          </div>
        )}

        {/* Form — only shown when logged in and not yet succeeded */}
        {currentUser && !success && (
          <>
            {submitError && (
              <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-5">
              {/* Star rating */}
              <fieldset>
                <legend className="block text-sm font-medium text-slate-700 mb-2">
                  Rating
                </legend>
                <div
                  className="flex gap-1"
                  onMouseLeave={() => setHovered(0)}
                  aria-describedby={errors.rating ? 'review-rating-error' : undefined}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                      aria-pressed={rating === star}
                      onMouseEnter={() => setHovered(star)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none focus:ring-2 focus:ring-aqua-500 rounded"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={displayRating >= star ? '#F59E0B' : 'none'}
                        stroke={displayRating >= star ? '#F59E0B' : '#94A3B8'}
                        strokeWidth={1.5}
                        className="w-8 h-8 transition-colors"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
                {errors.rating && (
                  <p id="review-rating-error" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.rating}
                  </p>
                )}
              </fieldset>

              {/* Comment */}
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-slate-700 mb-1">
                  Comment
                </label>
                <textarea
                  id="review-comment"
                  rows={4}
                  maxLength={MAX_COMMENT}
                  value={comment}
                  onChange={(ev) => setComment(ev.target.value)}
                  aria-describedby="review-comment-desc review-comment-counter"
                  aria-invalid={!!errors.comment}
                  className={`w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-aqua-500 ${
                    errors.comment ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                <div className="mt-1 flex justify-between items-start">
                  {errors.comment ? (
                    <p id="review-comment-desc" role="alert" className="text-xs text-red-600">
                      {errors.comment}
                    </p>
                  ) : (
                    <span id="review-comment-desc" />
                  )}
                  <span
                    id="review-comment-counter"
                    className="text-xs text-slate-400 ml-auto"
                    aria-live="polite"
                  >
                    {comment.length}/{MAX_COMMENT}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-aqua-600 py-2.5 text-sm font-semibold text-white hover:bg-aqua-700 focus:outline-none focus:ring-2 focus:ring-aqua-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {pending ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
