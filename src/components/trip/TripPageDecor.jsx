import planeClimb from '../../assets/decor/trip-plane-climb.svg'
import planeCruise from '../../assets/decor/trip-plane-cruise.svg'

export default function TripPageDecor({ variant = 'planner' }) {
  return (
    <div className={`trip-page-decor trip-page-decor--${variant}`} aria-hidden="true">
      <img
        className="trip-page-decor__plane trip-page-decor__plane--primary"
        src={planeCruise}
        alt=""
      />
      <img
        className="trip-page-decor__plane trip-page-decor__plane--secondary"
        src={planeClimb}
        alt=""
      />
      <span className="trip-page-decor__route trip-page-decor__route--one" />
      <span className="trip-page-decor__route trip-page-decor__route--two" />
    </div>
  )
}
