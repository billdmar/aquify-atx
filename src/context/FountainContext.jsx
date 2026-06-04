// Fountain context — subscribes once to the fountains collection (or local
// seed data in demo mode) and shares the list + loading/error state app-wide.

import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToFountains } from '../lib/firestore'

const FountainContext = createContext({
  fountains: [],
  loading: true,
  error: null,
})

export function FountainProvider({ children }) {
  const [fountains, setFountains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <FountainContext.Provider value={{ fountains, loading, error }}>
      {children}
    </FountainContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFountains() {
  return useContext(FountainContext)
}
