import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router'
import AddToCalendarModal from '../components/trip/AddToCalendarModal'
import ShareTripModal from '../components/trip/ShareTripModal'
import TravelEssentials from '../components/trip/TravelEssentials'
import TripUiIcon from '../components/trip/TripUiIcon.jsx'
import TravelAnimatedIcon from '../components/trip/TravelAnimatedIcon.jsx'
import CountryDataLoader from '../components/CountryDataLoader'
import useTripCountryImage from '../hooks/useTripCountryImage.js'
import {
  COUNTRY_REQUEST_STATUS,
  fetchCountryByCode,
  selectCountryByCode,
  selectCountryDetailStatus,
} from '../redux/countriesSlice.js'
import {
  fetchCountryClimate,
  fetchCountryConditions,
  selectCountryClimate,
  selectCountryConditions,
} from '../redux/countryInsightsSlice.js'
import { selectTripPlanById } from '../redux/tripPlansSlice.js'
import { formatMoney, formatTripDate, getTripDurationDays } from '../utils/tripPlan.js'

export default function TripPlanDetailsPage() {
  const dispatch = useDispatch()
  const { planId } = useParams()
  const plan = useSelector((state) => selectTripPlanById(state, planId))
  const country = useSelector((state) => selectCountryByCode(state, plan?.countryCode))
  const countryStatus = useSelector((state) => selectCountryDetailStatus(state, plan?.countryCode))
  const conditions = useSelector((state) => selectCountryConditions(state, plan?.countryCode))
  const climate = useSelector((state) => selectCountryClimate(state, plan?.countryCode))
  const [shareOpen, setShareOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const {
    image,
    loaded: imageLoaded,
    handleLoad: handleImageLoad,
    handleError: handleImageError,
    imageRef,
  } = useTripCountryImage(country, plan)

  useEffect(() => {
    if (!plan || country || countryStatus !== COUNTRY_REQUEST_STATUS.idle) return
    dispatch(fetchCountryByCode({ code: plan.countryCode }))
  }, [country, countryStatus, dispatch, plan])

  useEffect(() => {
    if (!country) return
    dispatch(fetchCountryConditions(country))
    dispatch(fetchCountryClimate({ country, location: null }))
  }, [country, dispatch])

  if (!plan) {
    return (
      <main className="shell trip-plan-missing">
        <p className="eyebrow">Saved trip plan</p>
        <h1>This trip plan is no longer available.</h1>
        <p>It may have been removed from Saved trips in this browser.</p>
        <Link className="primary-button" to="/saved?tab=trips">Back to Saved →</Link>
      </main>
    )
  }

  if (!country && (countryStatus === COUNTRY_REQUEST_STATUS.idle || countryStatus === COUNTRY_REQUEST_STATUS.loading)) {
    return <div className="shell trip-planner-state"><CountryDataLoader compact title="Opening saved trip…" label="Refreshing destination details" /></div>
  }

  const displayCountry = country || {
    code: plan.countryCode,
    name: plan.countryName,
    capital: plan.countryName,
    currencies: plan.destinationCurrency ? [{ code: plan.destinationCurrency, name: plan.destinationCurrency }] : [],
  }
  const duration = getTripDurationDays(plan.departureDate, plan.returnDate)
  const storedExchange = plan.exchangeRate > 0
    ? { status: 'succeeded', data: { rate: plan.exchangeRate, date: plan.updatedAt.slice(0, 10) } }
    : { status: 'failed', data: null }

  return (
    <main className="trip-plan-page">
      <div className="shell trip-plan-page__back"><Link to="/saved?tab=trips">← Back to Saved</Link></div>

      <section className={`shell trip-plan-hero${imageLoaded ? '' : ' trip-plan-hero--flag'}`}>
        {!imageLoaded && <div className="trip-plan-hero__media-fallback">{plan.countryFlagEmoji}</div>}
        {image && (
          <img
            key={image}
            ref={imageRef}
            className={imageLoaded ? 'trip-plan-hero__image--loaded' : ''}
            src={image}
            alt=""
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        <div className="trip-plan-hero__shade" />
        <div className="trip-plan-hero__copy">
          <p className="eyebrow">Saved trip plan</p>
          <h1>{plan.countryName} trip plan</h1>
          <strong>{formatTripDate(plan.departureDate)} – {formatTripDate(plan.returnDate)}</strong>
        </div>
        <div className="trip-plan-hero__facts">
          <span><small>Travel dates</small><strong>{formatTripDate(plan.departureDate, { includeYear: false })} – {formatTripDate(plan.returnDate)}</strong><i>{duration} days</i></span>
          <span><small>Travelers</small><strong>{plan.travelers}</strong><i>{plan.traveler.departureCity}</i></span>
          <span><small>Budget</small><strong>{formatMoney(plan.budgetAmount, plan.homeCurrency)}</strong>{plan.estimatedDestinationBudget > 0 && plan.destinationCurrency ? <i>≈ {formatMoney(plan.estimatedDestinationBudget, plan.destinationCurrency)}</i> : null}</span>
        </div>
      </section>

      <div className="shell trip-plan-actions">
        <button className="primary-button" type="button" onClick={() => setCalendarOpen(true)}><TripUiIcon name="calendar" size={18} /> Add to calendar</button>
        <button className="secondary-button" type="button" onClick={() => setShareOpen(true)}><TripUiIcon name="share" size={18} /> Share</button>
        <button className="secondary-button" type="button" onClick={() => window.print()}><TripUiIcon name="print" size={18} /> Print</button>
        <Link className="secondary-button trip-plan-actions__edit" to={`/countries/${plan.countryCode}/plan?edit=${plan.id}`}><TripUiIcon name="edit" size={18} /> Edit plan</Link>
      </div>

      <section className="shell trip-plan-grid">
        <div className="trip-plan-grid__main">
          <article className="trip-plan-panel">
            <div className="trip-plan-panel__heading"><TravelAnimatedIcon name="airplane" size={44} className="trip-plan-panel__icon" /><div><h2>Trip overview</h2><p>A quick look at your saved travel plan.</p></div></div>
            <dl className="trip-plan-overview">
              <div><dt>Destination</dt><dd>{plan.countryFlagEmoji} {plan.countryName}</dd></div>
              <div><dt>Travel dates</dt><dd>{formatTripDate(plan.departureDate)} – {formatTripDate(plan.returnDate)}</dd></div>
              <div><dt>Travelers</dt><dd>{plan.travelers}</dd></div>
              <div className="trip-plan-overview__budget"><dt>Total budget</dt><dd>{formatMoney(plan.budgetAmount, plan.homeCurrency)}{plan.estimatedDestinationBudget > 0 && plan.destinationCurrency ? <> <span className="trip-plan-budget-divider" aria-hidden="true">|</span> ≈ {formatMoney(plan.estimatedDestinationBudget, plan.destinationCurrency)}</> : null}</dd></div>
            </dl>
          </article>

          <article className="trip-plan-panel">
            <div className="trip-plan-panel__heading"><span className="trip-plan-panel__icon" aria-hidden="true"><TripUiIcon name="camera" size={23} /></span><div><h2>Preferences</h2><p>Your travel preferences for this trip.</p></div></div>
            <div className="trip-plan-tags">
              {plan.tripStyles.map((style) => <span key={style}>{style}</span>)}
            </div>
          </article>

          {plan.preferredRegions && (
            <article className="trip-plan-panel">
              <div className="trip-plan-panel__heading"><span className="trip-plan-panel__icon" aria-hidden="true"><TripUiIcon name="places" size={23} /></span><div><h2>Regions to visit</h2><p>Main destinations you want to explore.</p></div></div>
              <p className="trip-plan-copy">{plan.preferredRegions}</p>
            </article>
          )}

          <article className="trip-plan-panel">
            <div className="trip-plan-panel__heading"><span className="trip-plan-panel__icon" aria-hidden="true"><TripUiIcon name="passport" size={23} /></span><div><h2>Traveler details</h2><p>Contact information stored with this plan.</p></div></div>
            <dl className="trip-plan-overview">
              <div><dt>Name</dt><dd>{plan.traveler.fullName}</dd></div>
              <div><dt>Email</dt><dd>{plan.traveler.email}</dd></div>
              <div><dt>Phone</dt><dd>{plan.traveler.phone || '—'}</dd></div>
              <div><dt>Departure city</dt><dd>{plan.traveler.departureCity}</dd></div>
            </dl>
          </article>

          <article className="trip-plan-panel trip-plan-notes">
            <div className="trip-plan-panel__heading"><span className="trip-plan-panel__icon" aria-hidden="true"><TripUiIcon name="notes" size={23} /></span><div><h2>Notes</h2><p>Your reminders and ideas.</p></div></div>
            <p className="trip-plan-copy">{plan.notes || 'No additional notes were saved for this trip.'}</p>
          </article>
        </div>

        <div className="trip-plan-grid__aside">
          <TravelEssentials
            country={displayCountry}
            conditions={conditions}
            climate={climate}
            departureDate={plan.departureDate}
            homeCurrency={plan.homeCurrency}
            exchange={storedExchange}
            budgetAmount={plan.budgetAmount}
          />
        </div>
      </section>

      <ShareTripModal plan={shareOpen ? plan : null} onClose={() => setShareOpen(false)} />
      <AddToCalendarModal plan={calendarOpen ? plan : null} onClose={() => setCalendarOpen(false)} />
    </main>
  )
}
