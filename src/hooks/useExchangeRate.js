import { useEffect, useMemo, useState } from 'react'
import { fetchExchangeRate } from '../api/currency.js'

const sessionCache = new Map()
const cacheKey = (from, to) => `${String(from).toUpperCase()}:${String(to).toUpperCase()}`

export default function useExchangeRate(fromCurrency, toCurrency) {
  const key = useMemo(
    () => cacheKey(fromCurrency, toCurrency),
    [fromCurrency, toCurrency],
  )
  const [state, setState] = useState(() => ({
    status: sessionCache.has(key) ? 'succeeded' : 'idle',
    data: sessionCache.get(key) ?? null,
    error: null,
  }))

  useEffect(() => {
    if (!fromCurrency || !toCurrency) return undefined

    const cached = sessionCache.get(key)
    if (cached) {
      setState({ status: 'succeeded', data: cached, error: null })
      return undefined
    }

    const controller = new AbortController()
    setState({ status: 'loading', data: null, error: null })

    fetchExchangeRate(fromCurrency, toCurrency, { signal: controller.signal })
      .then((data) => {
        sessionCache.set(key, data)
        setState({ status: 'succeeded', data, error: null })
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        setState({
          status: 'failed',
          data: null,
          error: error?.message || 'Exchange rate unavailable',
        })
      })

    return () => controller.abort()
  }, [fromCurrency, key, toCurrency])

  return state
}
