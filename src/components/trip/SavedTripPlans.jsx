import { Link } from 'react-router'
import useTripCountryImage from '../../hooks/useTripCountryImage.js'
import { formatMoney, formatTripDate, getTripDurationDays } from '../../utils/tripPlan.js'
import TripUiIcon from './TripUiIcon.jsx'

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

export default function SavedTripPlans({ plans, countriesByCode, onDeletePlan }) {
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
    <div className="saved-trip-list">
      {plans.map((plan) => {
        const country = countriesByCode.get(plan.countryCode)
        const duration = getTripDurationDays(plan.departureDate, plan.returnDate)
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
              <div className="saved-trip-card__actions">
                <Link className="primary-button" to={`/saved/trips/${plan.id}`}>View plan →</Link>
                <Link className="secondary-button" to={`/countries/${plan.countryCode}/plan?edit=${plan.id}`}>Edit</Link>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
