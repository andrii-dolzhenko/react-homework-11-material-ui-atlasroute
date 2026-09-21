import { useState } from 'react'
import { buildTripIcs, getGoogleCalendarUrl } from '../../utils/tripPlan.js'
import TripUiIcon from './TripUiIcon.jsx'
import TripModalPortal from './TripModalPortal.jsx'

const downloadIcs = (plan) => {
  const blob = new Blob([buildTripIcs(plan)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${plan.countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-trip.ics`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function AddToCalendarModal({ plan, onClose }) {
  const [option, setOption] = useState('ics')
  const [message, setMessage] = useState('')
  if (!plan) return null

  const handleContinue = () => {
    if (option === 'google') {
      window.open(getGoogleCalendarUrl(plan), '_blank', 'noopener,noreferrer')
      setMessage('Google Calendar opened in a new tab.')
      return
    }
    downloadIcs(plan)
    setMessage('Calendar file downloaded.')
  }

  return (
    <TripModalPortal onClose={onClose}>
      <div className="trip-modal-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}>
        <section className="trip-modal trip-calendar-modal" role="dialog" aria-modal="true" aria-labelledby="trip-calendar-title">
          <button className="trip-modal__close" type="button" onClick={onClose} aria-label="Close">×</button>
          <div className="trip-modal__hero-icon" aria-hidden="true"><TripUiIcon name="calendar" size={28} /></div>
          <h2 id="trip-calendar-title">Add to calendar</h2>
          <p>Export your {plan.countryName} trip dates as a calendar event.</p>

          <div className="trip-calendar-modal__summary">
            <strong>{plan.countryName} trip</strong>
            <span>{plan.departureDate} → {plan.returnDate}</span>
            {plan.preferredRegions && <small>{plan.preferredRegions}</small>}
          </div>

          <label className={option === 'ics' ? 'trip-calendar-option trip-calendar-option--selected' : 'trip-calendar-option'}>
            <input type="radio" name="calendar-option" value="ics" checked={option === 'ics'} onChange={() => setOption('ics')} />
            <span aria-hidden="true"><TripUiIcon name="calendar" size={22} /></span>
            <div><strong>Download .ics</strong><small>Works with Apple Calendar, Outlook and most calendar apps</small></div>
          </label>

          <label className={option === 'google' ? 'trip-calendar-option trip-calendar-option--selected' : 'trip-calendar-option'}>
            <input type="radio" name="calendar-option" value="google" checked={option === 'google'} onChange={() => setOption('google')} />
            <span aria-hidden="true">31</span>
            <div><strong>Google Calendar</strong><small>Open a pre-filled event in Google Calendar</small></div>
          </label>

          <p className="trip-modal__status" role="status" aria-live="polite">{message}</p>

          <div className="trip-calendar-modal__actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="button" onClick={handleContinue}>
              {option === 'ics' ? 'Download' : 'Open Google Calendar'}
            </button>
          </div>
        </section>
      </div>
    </TripModalPortal>
  )
}
