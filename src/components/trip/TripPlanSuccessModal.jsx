import { Link } from 'react-router'
import TripModalPortal from './TripModalPortal.jsx'

export default function TripPlanSuccessModal({ plan, onClose, onContinue }) {
  if (!plan) return null

  return (
    <TripModalPortal onClose={onClose}>
      <div className="trip-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}>
        <section className="trip-modal trip-success-modal" role="dialog" aria-modal="true" aria-labelledby="trip-success-title">
          <button className="trip-modal__close" type="button" onClick={onClose} aria-label="Close">×</button>
          <div className="trip-success-modal__icon" aria-hidden="true">✓</div>
          <p className="eyebrow">Trip saved</p>
          <h2 id="trip-success-title">{plan.countryName} trip saved successfully</h2>
          <p>You can find it anytime from Saved → Trip plans.</p>
          <Link className="primary-button trip-success-modal__primary" to={`/saved/trips/${plan.id}`}>
            View plan <span aria-hidden="true">→</span>
          </Link>
          <button className="secondary-button trip-success-modal__secondary" type="button" onClick={onContinue || onClose}>
            Continue exploring
          </button>
        </section>
      </div>
    </TripModalPortal>
  )
}
