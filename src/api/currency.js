const PRIMARY_API = 'https://latest.currency-api.pages.dev/v1/currencies'
const FALLBACK_API = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies'

const normalizeCode = (value) => String(value ?? '').trim().toLowerCase()

const requestRate = async (baseUrl, from, to, { signal } = {}) => {
  const response = await fetch(`${baseUrl}/${from}.json`, { signal })
  if (!response.ok) throw new Error(`Exchange rate unavailable (${response.status})`)

  const payload = await response.json()
  const rate = Number(payload?.[from]?.[to])
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Exchange rate unavailable')

  return {
    rate,
    date: payload?.date || '',
  }
}

export const fetchExchangeRate = async (fromCode, toCode, { signal } = {}) => {
  const from = normalizeCode(fromCode)
  const to = normalizeCode(toCode)
  if (!from || !to) throw new Error('Currency code unavailable')
  if (from === to) return { rate: 1, date: new Date().toISOString().slice(0, 10) }

  try {
    return await requestRate(PRIMARY_API, from, to, { signal })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    return requestRate(FALLBACK_API, from, to, { signal })
  }
}
