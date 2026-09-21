import { useEffect, useMemo, useState } from 'react'
import { formatMoney } from '../../utils/tripPlan.js'
import TripUiIcon from './TripUiIcon.jsx'
import TravelAnimatedIcon from './TravelAnimatedIcon.jsx'

const getTimeZoneOffsetMinutes = (date, timeZone) => {
  if (!timeZone) return null

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })

    const parts = Object.fromEntries(
      formatter.formatToParts(date)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    )

    const utcValue = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )

    return Math.round((utcValue - date.getTime()) / 60000)
  } catch {
    return null
  }
}

const formatDifference = (destinationZone, date) => {
  if (!destinationZone) return ''
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const localOffset = getTimeZoneOffsetMinutes(date, localZone)
  const destinationOffset = getTimeZoneOffsetMinutes(date, destinationZone)
  if (!Number.isFinite(localOffset) || !Number.isFinite(destinationOffset)) return ''

  const difference = destinationOffset - localOffset
  if (difference === 0) return 'Same time as you'

  const absolute = Math.abs(difference)
  const hours = Math.floor(absolute / 60)
  const minutes = absolute % 60
  const amount = [hours ? `${hours}h` : '', minutes ? `${minutes}m` : ''].filter(Boolean).join(' ')
  return `${amount} ${difference > 0 ? 'ahead' : 'behind'}`
}

const formatDestinationTime = (timeZone, date) => {
  if (!timeZone) return '—'
  try {
    return new Intl.DateTimeFormat('en', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date)
  } catch {
    return '—'
  }
}

const EssentialIcon = ({ name }) => (
  <span className="travel-essential-card__icon-slot" aria-hidden="true">
    <span className="travel-essential-card__icon">
      <TripUiIcon name={name} size={22} />
    </span>
  </span>
)

export default function TravelEssentials({
  country,
  conditions,
  climate,
  departureDate,
  homeCurrency,
  exchange,
  budgetAmount,
}) {
  const destinationCurrency = country.currencies?.[0]?.code || ''
  const monthIndex = departureDate ? Number(departureDate.slice(5, 7)) - 1 : new Date().getMonth()
  const climateMonth = climate?.months?.[monthIndex] ?? null
  const destinationZone = conditions?.location?.timezone || climate?.location?.timezone || ''
  const [now, setNow] = useState(() => new Date())
  const exchangeRate = exchange?.data?.rate || exchange?.rate || 0
  const estimatedBudget = exchangeRate && Number(budgetAmount) > 0
    ? Number(budgetAmount) * exchangeRate
    : 0

  useEffect(() => {
    setNow(new Date())
    if (typeof window === 'undefined') return undefined
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [destinationZone])

  const climateLabel = useMemo(() => {
    if (!climateMonth) return 'Seasonal climate loads from recent historical averages.'
    const low = Number.isFinite(climateMonth.low) ? Math.round(climateMonth.low) : null
    const high = Number.isFinite(climateMonth.high) ? Math.round(climateMonth.high) : null
    if (low === null && high === null) return 'Seasonal climate unavailable.'
    return `${low ?? '—'}°C – ${high ?? '—'}°C typical daily low/high`
  }, [climateMonth])

  return (
    <aside className="travel-essentials" aria-labelledby="travel-essentials-title">
      <div className="travel-essentials__heading">
        <TravelAnimatedIcon name="world" size={46} className="travel-essentials__heading-icon" />
        <div>
          <h2 id="travel-essentials-title">Travel essentials</h2>
          <p>Useful context for planning {country.name}.</p>
        </div>
      </div>

      <div className="travel-essential-card travel-essential-card--currency">
        <EssentialIcon name="currency" />
        <div>
          <small>Local currency</small>
          <strong>{country.currencies?.[0]?.name || destinationCurrency || 'Currency unavailable'}</strong>
          {destinationCurrency && <span>{destinationCurrency}</span>}
          {exchange?.status === 'loading' && <p>Loading live conversion…</p>}
          {exchange?.status === 'succeeded' && exchange.data?.rate && (
            <p>
              1 {homeCurrency} ≈ {exchange.data.rate < 1 ? exchange.data.rate.toFixed(3) : exchange.data.rate.toFixed(2)} {destinationCurrency}
              {estimatedBudget > 0 && <> · {formatMoney(estimatedBudget, destinationCurrency)} budget</>}
            </p>
          )}
          {exchange?.status === 'failed' && <p>Live conversion unavailable. Your budget can still be saved.</p>}
        </div>
      </div>

      <div className="travel-essential-card">
        <EssentialIcon name="time" />
        <div>
          <small>Local time</small>
          <strong>{formatDestinationTime(destinationZone, now)}</strong>
          <span>{conditions?.location?.name || country.capital}</span>
          <p>{formatDifference(destinationZone, now) || 'Timezone information is loading.'}</p>
        </div>
      </div>

      <div className="travel-essential-card travel-essential-card--climate">
        <EssentialIcon name="climate" />
        <div>
          <small>Climate for your travel month</small>
          <strong>{climateMonth?.month || 'Seasonal climate'}</strong>
          <p>{climateLabel}</p>
        </div>
      </div>

      <div className="travel-essential-card travel-essential-card--advice">
        <EssentialIcon name="rules" />
        <div>
          <small>Entry, health & local rules</small>
          <strong>Verify official guidance before departure</strong>
          <p>
            Passport rules, health recommendations, tourist taxes and pet-entry requirements can change and depend on your circumstances.
          </p>
        </div>
      </div>
    </aside>
  )
}
