import { Link } from 'react-router'
import TripUiIcon from './TripUiIcon.jsx'
import TripPassportAnimation from './TripPassportAnimation.jsx'

const items = [
  ['calendar', 'Trip dates'],
  ['budget', 'Budget'],
  ['style', 'Trip style'],
  ['places', 'Places & regions'],
  ['notes', 'Notes'],
]

export default function TripPlanningTeaser({ country, countryImage = '', tripPlans = [] }) {
  const planCount = tripPlans.length
  const savedTarget = planCount === 1 ? `/saved/trips/${tripPlans[0].id}` : '/saved?tab=trips'

  return (
    <section
      className="shell trip-planning-teaser"
      id={`trip-planning-${country.code}`}
      aria-labelledby={`trip-planning-title-${country.code}`}
    >
      <div className="trip-planning-teaser__copy">
        <p className="eyebrow">Trip planning</p>
        {planCount > 0 && (
          <p className="trip-planning-teaser__saved-status">
            ✓ Already in Saved · {planCount} {planCount === 1 ? 'trip plan' : 'trip plans'}
          </p>
        )}
        <h2 id={`trip-planning-title-${country.code}`}>
          {planCount > 0 ? `Plan another ${country.name} trip` : `Plan your ${country.name} trip`}
        </h2>
        <p>
          Save dates, budget, preferences and practical travel details in one place.
          Turn inspiration into a plan you can return to, share, print or add to your calendar.
        </p>
        <div className="trip-planning-teaser__features" aria-label="Trip plan features">
          {items.map(([key, label]) => (
            <span key={key}><TripUiIcon name={key} size={17} />{label}</span>
          ))}
        </div>
      </div>

      <div className="trip-planning-teaser__visual">
        <div className="trip-planning-teaser__passport-slot">
          <TripPassportAnimation />
        </div>
        <div className="trip-planning-teaser__actions">
          {planCount > 0 && (
            <Link className="secondary-button" to={savedTarget}>
              View saved {planCount === 1 ? 'plan' : 'plans'}
            </Link>
          )}
          <Link
            className="primary-button trip-planning-teaser__button"
            to={`/countries/${country.code}/plan`}
            state={countryImage ? { countryImage } : undefined}
          >
            {planCount > 0 ? 'Plan another trip' : 'Plan this trip'} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
