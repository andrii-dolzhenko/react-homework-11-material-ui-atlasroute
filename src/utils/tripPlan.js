export const TRIP_STYLE_OPTIONS = Object.freeze([
  'Nature',
  'Cities',
  'Beaches',
  'Wildlife',
  'Culture',
  'Food',
  'Adventure',
  'Relaxation',
])

export const HOME_CURRENCY_OPTIONS = Object.freeze([
  'UAH', 'EUR', 'USD', 'GBP', 'PLN', 'CAD', 'AUD', 'JPY', 'CHF',
])

export const createTripPlanId = (countryCode, now = Date.now()) => (
  `${String(countryCode).toLowerCase()}-${now}`
)


export const findMatchingTripPlan = (plans, candidate, excludeId = '') => {
  if (!Array.isArray(plans) || !candidate) return null
  const countryCode = String(candidate.countryCode || '').toUpperCase()
  const departureDate = String(candidate.departureDate || '')
  const returnDate = String(candidate.returnDate || '')

  return plans.find((plan) => (
    plan.id !== excludeId
    && String(plan.countryCode || '').toUpperCase() === countryCode
    && plan.departureDate === departureDate
    && plan.returnDate === returnDate
  )) || null
}

export const getTripDurationDays = (departureDate, returnDate) => {
  const start = new Date(`${departureDate}T00:00:00`)
  const end = new Date(`${returnDate}T00:00:00`)
  const difference = end.getTime() - start.getTime()
  if (!Number.isFinite(difference) || difference < 0) return 0
  return Math.round(difference / 86400000) + 1
}

export const formatTripDate = (value, options = {}) => {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: options.includeYear === false ? undefined : 'numeric',
  }).format(date)
}

export const formatMoney = (amount, currency) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'

  try {
    return new Intl.NumberFormat('en', {
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value) + ` ${currency}`
  } catch {
    return `${Math.round(value)} ${currency}`
  }
}

export const buildTripShareText = (plan) => {
  const duration = getTripDurationDays(plan.departureDate, plan.returnDate)
  const styles = plan.tripStyles?.length ? plan.tripStyles.join(', ') : 'Flexible'
  const destinations = plan.preferredRegions || plan.countryName

  return [
    `${plan.countryName} trip plan`,
    `${formatTripDate(plan.departureDate)} – ${formatTripDate(plan.returnDate)} (${duration} days)`,
    `${plan.travelers} traveler${plan.travelers === 1 ? '' : 's'}`,
    `Budget: ${formatMoney(plan.budgetAmount, plan.homeCurrency)}`,
    `Trip style: ${styles}`,
    `Places: ${destinations}`,
    plan.notes ? `Notes: ${plan.notes}` : '',
  ].filter(Boolean).join('\n')
}

const escapeIcsText = (value) => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;')

const compactDate = (value) => String(value ?? '').replaceAll('-', '')

export const buildTripIcs = (plan) => {
  const start = compactDate(plan.departureDate)
  const endDate = new Date(`${plan.returnDate}T00:00:00`)
  endDate.setDate(endDate.getDate() + 1)
  const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`
  const description = buildTripShareText(plan)
  const uid = `${plan.id}@atlasroute.local`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AtlasRoute//Trip Plan//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(`${plan.countryName} trip`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(plan.countryName)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export const getGoogleCalendarUrl = (plan) => {
  const start = compactDate(plan.departureDate)
  const endDate = new Date(`${plan.returnDate}T00:00:00`)
  endDate.setDate(endDate.getDate() + 1)
  const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${plan.countryName} trip`,
    dates: `${start}/${end}`,
    details: buildTripShareText(plan),
    location: plan.countryName,
  })

  return `https://calendar.google.com/calendar/render?${params}`
}
