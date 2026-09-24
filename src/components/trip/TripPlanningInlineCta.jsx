import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { getSavedTripTarget } from '../../utils/tripPlan.js'
import TripFlightAnimation from './TripFlightAnimation.jsx'

export default function TripPlanningInlineCta({ country, tripPlans = [] }) {
  const ref = useRef(null)
  const [attention, setAttention] = useState(false)
  const planCount = tripPlans.length
  const savedTarget = getSavedTripTarget(tripPlans, country.code)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      setAttention(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setAttention(true)
      observer.disconnect()
    }, { threshold: 0.55 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="shell trip-inline-cta-wrap">
      <div className={`trip-inline-cta${attention ? ' trip-inline-cta--attention' : ''}${planCount > 0 ? ' trip-inline-cta--saved' : ''}`}>
        <span className="trip-inline-cta__copy">
          {planCount > 0 && (
            <span className="trip-inline-cta__saved-status">
              ✓ Already in Saved · {planCount} {planCount === 1 ? 'trip plan' : 'trip plans'}
            </span>
          )}
          <small>{planCount > 0 ? 'Planning another route?' : 'Ready to turn this into a real trip?'}</small>
          <strong>{planCount > 0 ? `Plan another ${country.name} trip` : `Plan your ${country.name} trip`}</strong>
        </span>

        <TripFlightAnimation />

        <span className="trip-inline-cta__actions">
          {planCount > 0 && (
            <Link className="trip-inline-cta__saved-link" to={savedTarget}>
              {planCount === 1 ? 'View saved plan' : `View ${planCount} saved trips`}
            </Link>
          )}
          <a className="primary-button trip-inline-cta__action" href={`#trip-planning-${country.code}`}>
            {planCount > 0 ? 'Plan another trip ↓' : 'Start planning ↓'}
          </a>
        </span>
      </div>
    </div>
  )
}
