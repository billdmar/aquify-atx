// Fountain context — subscribes once to the fountains collection (or local
// seed data in demo mode) and shares the list + loading/error state app-wide.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { subscribeToFountains } from '../lib/firestore'
import type { Fountain } from '../types'

interface FountainContextValue {
  fountains: Fountain[]
  loading: boolean
  error: Error | null
}

const FountainContext = createContext<FountainContextValue>({
  fountains: [],
  loading: true,
  error: null,
})

export function FountainProvider({ children }: { children: ReactNode }) {
  const [fountains, setFountains] = useState<Fountain[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToFountains(
      (data) => {
        setFountains(data)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  const value = useMemo<FountainContextValue>(
    () => ({ fountains, loading, error }),
    [fountains, loading, error],
  )

  return (
    <FountainContext.Provider value={value}>
      {children}
    </FountainContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFountains(): FountainContextValue {
  return useContext(FountainContext)
}
