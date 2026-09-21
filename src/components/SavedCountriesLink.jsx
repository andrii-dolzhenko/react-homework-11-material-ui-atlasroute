import { memo } from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router'
import { selectSavedCount } from '../redux/savedCountriesSlice'
import { selectTripPlanCount } from '../redux/tripPlansSlice'

function SavedCountriesLink() {
  const savedCountryCount = useSelector(selectSavedCount)
  const tripPlanCount = useSelector(selectTripPlanCount)
  const savedCount = savedCountryCount + tripPlanCount
  const countLabel = savedCount > 99 ? '99+' : savedCount
  const savedLabel = savedCount === 1 ? 'saved item' : 'saved items'
  const ariaLabel = savedCount
    ? `Open Saved, ${savedCount} ${savedLabel}`
    : 'Open Saved, no saved items'

  return (
    <NavLink
      to="/saved"
      className={({ isActive }) => (
        `saved-countries-link${isActive ? ' saved-countries-link--active' : ''}`
      )}
      aria-label={ariaLabel}
      title="Saved"
    >
      <span className="saved-countries-link__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M6.75 4.75A2.75 2.75 0 0 1 9.5 2h5a2.75 2.75 0 0 1 2.75 2.75V21L12 17.65 6.75 21V4.75Z"></path>
        </svg>
      </span>
      <span className="saved-countries-link__count" aria-hidden="true">
        {countLabel}
      </span>
    </NavLink>
  )
}

export default memo(SavedCountriesLink)
