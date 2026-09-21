import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import roadSegmentA from '../../assets/trip-road-segment-a.json'
import roadSegmentB from '../../assets/trip-road-segment-b.json'
import roadVehicle from '../../assets/trip-road-vehicle.json'

const readReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

export default function TripRoadAnimation() {
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setReducedMotion(query.matches)
    query.addEventListener?.('change', handleChange)
    return () => query.removeEventListener?.('change', handleChange)
  }, [])

  const motionProps = {
    autoplay: !reducedMotion,
    loop: !reducedMotion,
  }

  return (
    <span className="trip-road-animation" aria-hidden="true">
      <span className="trip-road-animation__scene">
        <span className="trip-road-animation__segment trip-road-animation__segment--a">
          <Lottie animationData={roadSegmentA} {...motionProps} />
        </span>
        <span className="trip-road-animation__segment trip-road-animation__segment--b">
          <Lottie animationData={roadSegmentB} {...motionProps} />
        </span>
        <span className="trip-road-animation__seam" />
      </span>

      <span className="trip-road-animation__vehicle">
        <Lottie animationData={roadVehicle} {...motionProps} />
      </span>
    </span>
  )
}
