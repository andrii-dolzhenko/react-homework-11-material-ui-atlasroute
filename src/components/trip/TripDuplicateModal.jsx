import { formatTripDate } from '../../utils/tripPlan.js'
import TripUiIcon from './TripUiIcon.jsx'
import TripModalPortal from './TripModalPortal.jsx'

export default function TripDuplicateModal({ existingPlan, candidatePlan, onViewExisting, onCreateDuplicate, onChangeDates, onClose }) {
  if (!existingPlan) return null

  return (
    <TripModalPortal onClose={onClose}>
      <div className="trip-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}>
        <section className="trip-modal trip-duplicate-modal" role="dialog" aria-modal="true" aria-labelledby="trip-duplicate-title">
          <button className="trip-modal__close" type="button" onClick={onClose} aria-label="Close">×</button>
          <span className="trip-modal__hero-icon trip-modal__hero-icon--warning" aria-hidden="true">
            <TripUiIcon name="warning" size={30} />
          </span>
          <p className="eyebrow">Same destination · same dates</p>
          <h2 id="trip-duplicate-title">You already have a saved trip for these dates</h2>
          <p>
            Your {existingPlan.countryName} plan already covers{' '}
            <strong>{formatTripDate(existingPlan.departureDate)} – {formatTripDate(existingPlan.returnDate)}</strong>.
            Choose different dates, open the saved plan, or keep these dates and create another version intentionally.
          </p>
          <div className="trip-duplicate-modal__date-card" aria-label="Trip date comparison">
            <span><small>Saved trip</small><strong>{formatTripDate(existingPlan.departureDate)} – {formatTripDate(existingPlan.returnDate)}</strong></span>
            <span><small>New plan</small><strong>Same dates{candidatePlan?.tripStyles?.length ? ` · ${candidatePlan.tripStyles.join(', ')}` : ''}</strong></span>
          </div>
          <div className="trip-duplicate-modal__actions">
            <div className="trip-duplicate-modal__secondary-actions">
              <button className="secondary-button" type="button" onClick={onChangeDates}>Choose different dates</button>
              <button className="secondary-button" type="button" onClick={onViewExisting}>View saved plan</button>
            </div>
            <button className="primary-button trip-duplicate-modal__primary" type="button" onClick={onCreateDuplicate}>
              Create another anyway
            </button>
          </div>
        </section>
      </div>
    </TripModalPortal>
  )
}
