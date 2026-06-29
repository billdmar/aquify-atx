// useForm — a small, typed form-state hook that centralizes the
// values / errors / pending / submit-error pattern duplicated across the
// auth and submission forms (Login, Register, Submit, ReviewModal).
//
// handleSubmit runs the supplied `validate`; if it returns any field errors,
// they are stored and submission is aborted. Otherwise it clears errors, sets
// `pending`, calls `onSubmit` in a try/catch (a thrown error becomes
// `submitError`), and clears `pending` in a finally.

import { useCallback, useState } from 'react'

export type FormErrors<T> = Partial<Record<keyof T, string>>

interface UseFormOptions<T> {
  initialValues: T
  validate: (values: T) => FormErrors<T>
  onSubmit: (values: T) => Promise<void> | void
}

interface UseFormResult<T> {
  values: T
  errors: FormErrors<T>
  pending: boolean
  submitError: string
  setField: <K extends keyof T>(field: K, value: T[K]) => void
  handleSubmit: (event: React.FormEvent) => Promise<void>
  reset: () => void
  setSubmitError: (message: string) => void
}

export function useForm<T>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [pending, setPending] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const setField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setPending(false)
    setSubmitError('')
  }, [initialValues])

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setSubmitError('')
      const nextErrors = validate(values)
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors)
        return
      }
      setErrors({})
      setPending(true)
      try {
        await onSubmit(values)
      } catch (err) {
        setSubmitError(
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong. Please try again.',
        )
      } finally {
        setPending(false)
      }
    },
    [validate, onSubmit, values],
  )

  return {
    values,
    errors,
    pending,
    submitError,
    setField,
    handleSubmit,
    reset,
    setSubmitError,
  }
}
