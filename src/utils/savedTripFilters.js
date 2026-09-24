import { toLocalDateInputValue } from './dateInput.js'
import { getTripReadinessSummary } from './tripReadiness.js'

export const SAVED_TRIP_PERIODS = Object.freeze(['all', 'upcoming', 'past'])
export const SAVED_TRIP_READINESS_FILTERS = Object.freeze([
  'all',
  'not-started',
  'in-progress',
  'needs-attention',
  'ready',
  'complete',
])
export const SAVED_TRIP_SORTS = Object.freeze([
  'updated-desc',
  'created-desc',
  'trip-soonest',
  'trip-latest',
  'destination-asc',
  'destination-desc',
])

const safeText = (value) => (typeof value === 'string' ? value : '')
const isPastTrip = (plan, today) => {
  const returnDate = safeText(plan?.returnDate)
  return Boolean(returnDate) && returnDate < today
}
const compareDateText = (left, right) => safeText(left).localeCompare(safeText(right))

const compareSoonest = (left, right, today) => {
  const leftPast = isPastTrip(left, today)
  const rightPast = isPastTrip(right, today)

  if (leftPast !== rightPast) return leftPast ? 1 : -1

  // Upcoming/ongoing trips: nearest departure first.
  // Past trips: most recent trip first.
  return leftPast
    ? compareDateText(right.departureDate, left.departureDate)
    : compareDateText(left.departureDate, right.departureDate)
}

const comparePlans = (left, right, sort, today) => {
  switch (sort) {
    case 'created-desc':
      return compareDateText(right.createdAt, left.createdAt)
    case 'trip-soonest':
      return compareSoonest(left, right, today)
    case 'trip-latest':
      return compareDateText(right.departureDate, left.departureDate)
    case 'destination-asc':
      return safeText(left.countryName).localeCompare(safeText(right.countryName), 'en', { sensitivity: 'base' })
    case 'destination-desc':
      return safeText(right.countryName).localeCompare(safeText(left.countryName), 'en', { sensitivity: 'base' })
    case 'updated-desc':
    default:
      return compareDateText(right.updatedAt, left.updatedAt)
  }
}

export const filterAndSortSavedTrips = (
  plans,
  {
    period = 'all',
    readiness = 'all',
    sort = 'updated-desc',
    countryCode = '',
    today = toLocalDateInputValue(),
  } = {},
) => {
  if (!Array.isArray(plans)) return []

  const safeToday = /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : toLocalDateInputValue()
  const normalizedCountryCode = safeText(countryCode).trim().toUpperCase()

  return plans
    .filter((plan) => {
      if (normalizedCountryCode && safeText(plan?.countryCode).toUpperCase() !== normalizedCountryCode) return false
      if (period === 'past' && !isPastTrip(plan, safeToday)) return false
      if (period === 'upcoming' && isPastTrip(plan, safeToday)) return false
      if (readiness !== 'all' && getTripReadinessSummary(plan).status !== readiness) return false
      return true
    })
    .slice()
    .sort((left, right) => comparePlans(left, right, sort, safeToday))
}
