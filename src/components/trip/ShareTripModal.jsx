import { useState } from 'react'
import { buildTripShareText } from '../../utils/tripPlan.js'
import TripUiIcon from './TripUiIcon.jsx'
import TripModalPortal from './TripModalPortal.jsx'

export default function ShareTripModal({ plan, onClose }) {
  const [message, setMessage] = useState('')
  if (!plan) return null

  const shareText = buildTripShareText(plan)

  const handleNativeShare = async (event) => {
    const trigger = event?.currentTarget
    if (event?.detail > 0) trigger?.blur()
    if (!navigator.share) {
      setMessage('Native share is not available in this browser. Use Copy trip summary instead.')
      return
    }

    try {
      await navigator.share({
        title: `${plan.countryName} trip plan`,
        text: shareText,
      })
      setMessage('Trip summary shared.')
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage('The share action could not be completed.')
    }
  }

  const handleCopy = async (event) => {
    const trigger = event?.currentTarget
    if (event?.detail > 0) trigger?.blur()
    try {
      await navigator.clipboard.writeText(shareText)
      setMessage('Trip summary copied to clipboard!')
    } catch {
      setMessage('Clipboard access is unavailable in this browser.')
    }
  }

  return (
    <TripModalPortal onClose={onClose}>
      <div className="trip-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}>
        <section className="trip-modal trip-share-modal" role="dialog" aria-modal="true" aria-labelledby="trip-share-title">
          <button className="trip-modal__close" type="button" onClick={onClose} aria-label="Close">×</button>
          <div className="trip-modal__hero-icon" aria-hidden="true"><TripUiIcon name="share" size={28} /></div>
          <h2 id="trip-share-title">Share trip plan</h2>
          <p>Share your {plan.countryName} trip details without needing an AtlasRoute account.</p>

          <div className="trip-share-modal__preview">
            {plan.countryFlagEmoji && <span aria-hidden="true">{plan.countryFlagEmoji}</span>}
            <div>
              <strong>{plan.countryName}</strong>
              <small>{plan.departureDate} → {plan.returnDate} · {plan.travelers} traveler{plan.travelers === 1 ? '' : 's'}</small>
            </div>
          </div>

          <div className="trip-share-modal__options">
            <button type="button" onClick={handleNativeShare}>
              <span aria-hidden="true"><TripUiIcon name="share" size={22} /></span>
              <strong>Native share</strong>
              <small>Email, Messages, WhatsApp and other device apps</small>
            </button>
            <button type="button" onClick={handleCopy}>
              <span aria-hidden="true"><TripUiIcon name="notes" size={22} /></span>
              <strong>Copy trip summary</strong>
              <small>Copy ready-to-share text with the key trip details</small>
            </button>
          </div>

          <p className="trip-modal__status" role="status" aria-live="polite">{message}</p>
          <button className="secondary-button trip-modal__cancel" type="button" onClick={onClose}>Close</button>
        </section>
      </div>
    </TripModalPortal>
  )
}
