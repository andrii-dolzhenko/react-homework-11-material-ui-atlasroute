import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import planeFlight from '../../assets/trip-plane-flight.json'

const readReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

export default function TripFlightAnimation() {
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setReducedMotion(query.matches)
    query.addEventListener?.('change', handleChange)
    return () => query.removeEventListener?.('change', handleChange)
  }, [])

  return (
    <span className="trip-flight-animation" aria-hidden="true">
      <span className="trip-flight-animation__plane">
        <span className="trip-flight-animation__lottie">
          <Lottie
            animationData={planeFlight}
            autoplay={!reducedMotion}
            loop={!reducedMotion}
          />
        </span>
      </span>
    </span>
  )
}
