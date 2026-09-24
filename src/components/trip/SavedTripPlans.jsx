import { useMemo, useState } from 'react'
import {
  Button,
  Chip,
  FormControl,
  LinearProgress,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { Link } from 'react-router'
import useTripCountryImage from '../../hooks/useTripCountryImage.js'
import { formatMoney, formatTripDate, getTripDurationDays } from '../../utils/tripPlan.js'
import { getReadinessStatusLabel, getTripReadinessSummary } from '../../utils/tripReadiness.js'
import { filterAndSortSavedTrips } from '../../utils/savedTripFilters.js'
import TripUiIcon from './TripUiIcon.jsx'
import TripReadinessModal from './TripReadinessModal.jsx'

const STATUS_TONE = {
  'not-started': 'neutral',
  'needs-attention': 'danger',
  'in-progress': 'info',
  ready: 'success',
  complete: 'success',
}

const READINESS_FILTER_OPTIONS = Object.freeze([
  ['all', 'All readiness'],
  ['not-started', 'Not started'],
  ['in-progress', 'In progress'],
  ['needs-attention', 'Needs attention'],
  ['ready', 'Ready'],
  ['complete', 'Complete'],
])

const SORT_OPTIONS = Object.freeze([
  ['updated-desc', 'Recently updated'],
  ['created-desc', 'Recently added'],
  ['trip-soonest', 'Trip date — soonest'],
  ['trip-latest', 'Trip date — latest'],
  ['destination-asc', 'Destination — A to Z'],
  ['destination-desc', 'Destination — Z to A'],
])

function SavedTripVisual({ plan, country }) {
  const {
    image,
    loaded,
    handleLoad,
    handleError,
    imageRef,
  } = useTripCountryImage(country, plan)

  return (
    <div className={`saved-trip-card__visual${loaded ? '' : ' saved-trip-card__visual--flag'}`}>
      {!loaded && (
        <span className="saved-trip-card__visual-fallback" aria-hidden="true">
          {plan.countryFlagEmoji}
        </span>
      )}
      {image && (
        <img
          key={image}
          ref={imageRef}
          className={loaded ? 'saved-trip-card__image--loaded' : ''}
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      <span className="saved-trip-card__visual-shade" aria-hidden="true" />
    </div>
  )
}

function SavedTripFilters({
  period,
  readiness,
  sort,
  hasActiveFilters,
  countryFilterName,
  onPeriodChange,
  onReadinessChange,
  onSortChange,
  onReset,
  onClearCountryFilter,
}) {
  return (
    <div className={`saved-trip-filters${countryFilterName ? ' saved-trip-filters--country' : ''}`} aria-label="Trip plan filters and sorting">
      <div className="saved-trip-filters__period">
        <ToggleButtonGroup
          exclusive
          size="small"
          value={period}
          onChange={(_, nextValue) => {
            if (nextValue) onPeriodChange(nextValue)
          }}
          aria-label="Filter trip plans by timing"
        >
          <ToggleButton value="all" aria-label="Show all trip plans">All</ToggleButton>
          <ToggleButton value="upcoming" aria-label="Show upcoming trip plans">Upcoming</ToggleButton>
          <ToggleButton value="past" aria-label="Show past trip plans">Past</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {countryFilterName && (
        <div className="saved-trip-filters__country">
          <Chip
            label={countryFilterName}
            onDelete={onClearCountryFilter}
            aria-label={`Country filter: ${countryFilterName}`}
          />
        </div>
      )}

      <div className="saved-trip-filters__select">
        <span>Readiness</span>
        <FormControl size="small" fullWidth>
          <Select
            value={readiness}
            onChange={(event) => onReadinessChange(event.target.value)}
            inputProps={{ 'aria-label': 'Filter trip plans by readiness' }}
          >
            {READINESS_FILTER_OPTIONS.map(([value, label]) => (
              <MenuItem value={value} key={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="saved-trip-filters__select">
        <span>Sort by</span>
        <FormControl size="small" fullWidth>
          <Select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            inputProps={{ 'aria-label': 'Sort trip plans' }}
          >
            {SORT_OPTIONS.map(([value, label]) => (
              <MenuItem value={value} key={value}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="saved-trip-filters__reset">
        <Button
          type="button"
          variant="outlined"
          size="small"
          disabled={!hasActiveFilters}
          onClick={onReset}
          aria-label="Reset trip filters and sorting"
        >
          Reset filters
        </Button>
      </div>
    </div>
  )
}

export default function SavedTripPlans({
  plans,
  countriesByCode,
  onDeletePlan,
  countryFilterCode = '',
  countryFilterName = '',
  onClearCountryFilter,
}) {
  const [readinessPlanId, setReadinessPlanId] = useState('')
  const [animationRun, setAnimationRun] = useState(0)
  const [periodFilter, setPeriodFilter] = useState('all')
  const [readinessFilter, setReadinessFilter] = useState('all')
  const [sortMode, setSortMode] = useState('updated-desc')
  const readinessPlan = plans.find((plan) => plan.id === readinessPlanId) || null

  const visiblePlans = useMemo(() => filterAndSortSavedTrips(plans, {
    period: periodFilter,
    readiness: readinessFilter,
    sort: sortMode,
    countryCode: countryFilterCode,
  }), [plans, periodFilter, readinessFilter, sortMode, countryFilterCode])

  const hasActiveFilters = Boolean(countryFilterCode) || periodFilter !== 'all' || readinessFilter !== 'all' || sortMode !== 'updated-desc'

  const openReadiness = (planId) => {
    setReadinessPlanId(planId)
    setAnimationRun((value) => value + 1)
  }

  const resetFilters = () => {
    setPeriodFilter('all')
    setReadinessFilter('all')
    setSortMode('updated-desc')
    onClearCountryFilter?.()
  }

  if (!plans.length) {
    return (
      <div className="saved-trips-empty">
        <span aria-hidden="true">▣</span>
        <h2>No trip plans yet</h2>
        <p>Open a country, explore it, then use “Plan this trip” to save dates, budget and travel preferences.</p>
        <Link className="primary-button" to="/countries">Explore countries →</Link>
      </div>
    )
  }

  return (
    <>
      {(plans.length > 1 || countryFilterCode) && (
        <SavedTripFilters
          period={periodFilter}
          readiness={readinessFilter}
          sort={sortMode}
          hasActiveFilters={hasActiveFilters}
          countryFilterName={countryFilterName}
          onPeriodChange={setPeriodFilter}
          onReadinessChange={setReadinessFilter}
          onSortChange={setSortMode}
          onReset={resetFilters}
          onClearCountryFilter={onClearCountryFilter}
        />
      )}

      {visiblePlans.length === 0 ? (
        <div className="saved-trip-filter-empty">
          <span className="saved-trip-filter-empty__icon" aria-hidden="true">
            <TripUiIcon name="checklist" size={22} />
          </span>
          <h3>No trip plans match these filters</h3>
          <p>Try another trip timing or readiness status, or reset the current filters.</p>
        </div>
      ) : (
        <div className="saved-trip-list">
          {visiblePlans.map((plan) => {
            const country = countriesByCode.get(plan.countryCode)
            const duration = getTripDurationDays(plan.departureDate, plan.returnDate)
            const readiness = getTripReadinessSummary(plan)
            const tone = STATUS_TONE[readiness.status]
            return (
              <article className="saved-trip-card" key={plan.id}>
                <SavedTripVisual plan={plan} country={country} />
                <div className="saved-trip-card__body">
                  <div className="saved-trip-card__topline">
                    <div>
                      <p className="eyebrow">Saved trip plan</p>
                      <h3>{plan.countryName}</h3>
                    </div>
                    <div className="saved-trip-card__meta-actions">
                      <small>Updated {formatTripDate(plan.updatedAt.slice(0, 10))}</small>
                      <button
                        className="saved-trip-card__delete"
                        type="button"
                        onClick={() => onDeletePlan(plan)}
                        aria-label={`Delete ${plan.countryName} trip plan`}
                        title="Delete trip plan"
                      >
                        <TripUiIcon name="trash" size={19} />
                      </button>
                    </div>
                  </div>
                  <div className="saved-trip-card__facts">
                    <span><small>Travel dates</small><strong>{formatTripDate(plan.departureDate, { includeYear: false })} – {formatTripDate(plan.returnDate)}</strong><i>{duration} days</i></span>
                    <span><small>Travelers</small><strong>{plan.travelers}</strong><i>{plan.traveler?.departureCity || 'Departure city saved'}</i></span>
                    <span><small>Budget</small><strong>{formatMoney(plan.budgetAmount, plan.homeCurrency)}</strong>{plan.estimatedDestinationBudget > 0 && plan.destinationCurrency ? <i>≈ {formatMoney(plan.estimatedDestinationBudget, plan.destinationCurrency)}</i> : null}</span>
                    <span><small>Trip style</small><strong>{plan.tripStyles.slice(0, 3).join(', ') || 'Flexible'}</strong></span>
                  </div>

                  <button className="saved-trip-readiness" type="button" onClick={() => openReadiness(plan.id)}>
                    <span className={`saved-trip-readiness__icon saved-trip-readiness__icon--${tone}`}>
                      <TripUiIcon name="checklist" size={19} />
                    </span>
                    <span className="saved-trip-readiness__copy">
                      <small>Trip readiness</small>
                      <strong>{readiness.status === 'not-started' ? 'Not started' : `${readiness.completed}/${readiness.total} completed`}</strong>
                    </span>
                    <span className="saved-trip-readiness__progress">
                      <LinearProgress variant="determinate" value={readiness.percent} className={`readiness-progress readiness-progress--${tone}`} />
                      <small>{getReadinessStatusLabel(readiness.status)}</small>
                    </span>
                    <span className="saved-trip-readiness__arrow" aria-hidden="true"><TripUiIcon name="chevronRight" size={18} /></span>
                  </button>

                  <div className="saved-trip-card__actions">
                    <Link className="primary-button" to={`/saved/trips/${plan.id}`}>View plan →</Link>
                    <Link className="secondary-button" to={`/countries/${plan.countryCode}/plan?edit=${plan.id}`}>Edit</Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <TripReadinessModal
        plan={readinessPlan}
        open={Boolean(readinessPlan)}
        onClose={() => setReadinessPlanId('')}
        playKey={animationRun}
      />
    </>
  )
}
