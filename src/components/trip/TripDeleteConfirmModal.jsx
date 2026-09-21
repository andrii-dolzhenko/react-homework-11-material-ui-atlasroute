import TripUiIcon from './TripUiIcon.jsx'
import TripModalPortal from './TripModalPortal.jsx'

export default function TripDeleteConfirmModal({ plan, clearAll = false, onConfirm, onClose }) {
  if (!plan && !clearAll) return null

  const title = clearAll ? 'Delete all trip plans?' : `Delete ${plan.countryName} trip plan?`
  const message = clearAll
    ? 'Every saved trip plan in this browser will be removed. Saved countries will stay untouched. This action cannot be undone.'
    : 'This trip plan will be permanently removed from Saved → Trip plans in this browser. This action cannot be undone.'

  return (
    <TripModalPortal onClose={onClose}>
      <div className="trip-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}>
        <section className="trip-modal trip-delete-modal" role="dialog" aria-modal="true" aria-labelledby="trip-delete-title">
          <button className="trip-modal__close" type="button" onClick={onClose} aria-label="Close">×</button>
          <span className="trip-modal__hero-icon trip-modal__hero-icon--danger" aria-hidden="true">
            <TripUiIcon name="trash" size={29} />
          </span>
          <p className="eyebrow">Confirm deletion</p>
          <h2 id="trip-delete-title">{title}</h2>
          <p>{message}</p>
          <div className="trip-delete-modal__actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="trip-danger-button" type="button" onClick={onConfirm}>{clearAll ? 'Delete all plans' : 'Delete plan'}</button>
          </div>
        </section>
      </div>
    </TripModalPortal>
  )
}
