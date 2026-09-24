import TripModalPortal from './TripModalPortal.jsx'
import TripUiIcon from './TripUiIcon.jsx'

const travelerDisplayName = (traveler, fallback) => traveler?.fullName?.trim() || fallback

export default function TravelerReductionModal({
  travelers,
  nextCount,
  traveler,
  travelerNumber,
  onConfirm,
  onClose,
}) {
  const isSingleRemoval = Boolean(traveler)
  const removalList = isSingleRemoval ? [traveler] : (travelers || [])
  if (!removalList.length) return null

  const singleName = travelerDisplayName(traveler, `Traveler ${travelerNumber || ''}`.trim())
  const title = isSingleRemoval
    ? `Remove ${singleName}?`
    : `Remove ${removalList.length} traveler${removalList.length === 1 ? '' : 's'}?`
  const confirmLabel = isSingleRemoval ? 'Remove traveler' : 'Remove travelers'

  return (
    <TripModalPortal onClose={onClose}>
      <div className="trip-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}>
        <section className="trip-modal trip-traveler-reduction-modal" role="dialog" aria-modal="true" aria-labelledby="traveler-reduction-title">
          <button className="trip-modal__close" type="button" onClick={onClose} aria-label="Close">×</button>
          <span className="trip-modal__hero-icon trip-modal__hero-icon--warning" aria-hidden="true">
            <TripUiIcon name={isSingleRemoval ? 'trash' : 'person'} size={29} />
          </span>
          <p className="eyebrow">{isSingleRemoval ? 'Remove traveler' : 'Traveler list changed'}</p>
          <h2 id="traveler-reduction-title">{title}</h2>
          <p>
            {isSingleRemoval
              ? 'This removes the traveler from the current trip plan. Any saved readiness progress for this traveler will also be removed when you save the changes.'
              : `This trip will be reduced to ${nextCount} traveler${nextCount === 1 ? '' : 's'}. Their traveler details will be removed from the current trip plan, and any saved readiness progress for them will be removed when you save the changes.`}
          </p>
          <div className="trip-traveler-reduction-modal__list">
            {removalList.map((item, index) => (
              <span key={item.id || `${item.fullName}-${index}`}>
                <TripUiIcon name="person" size={17} />
                <strong>{travelerDisplayName(item, `Traveler ${(isSingleRemoval ? travelerNumber : nextCount + index + 1) || index + 1}`)}</strong>
              </span>
            ))}
          </div>
          <div className="trip-delete-modal__actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="trip-danger-button" type="button" onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </section>
      </div>
    </TripModalPortal>
  )
}
