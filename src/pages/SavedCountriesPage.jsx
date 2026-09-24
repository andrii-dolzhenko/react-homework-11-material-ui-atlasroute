import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router'
import SavedCountriesGrid from '../components/SavedCountriesGrid'
import SavedEmptyState from '../components/SavedEmptyState'
import CountryDataError from '../components/CountryDataError'
import CountryGridSkeleton from '../components/CountryGridSkeleton'
import SavedTripPlans from '../components/trip/SavedTripPlans'
import TripDeleteConfirmModal from '../components/trip/TripDeleteConfirmModal'
import {
  clearSavedCountries,
  selectSavedCount,
  selectSavedCountryCodes,
} from '../redux/savedCountriesSlice'
import {
  clearTripPlans,
  deleteTripPlan,
  selectTripPlanCount,
  selectTripPlans,
} from '../redux/tripPlansSlice'
import {
  COUNTRY_REQUEST_STATUS,
  fetchCountries,
  selectCountries,
  selectCountriesStatus,
} from '../redux/countriesSlice.js'

export default function SavedCountriesPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [clearTripsOpen, setClearTripsOpen] = useState(false)
  const countries = useSelector(selectCountries)
  const countriesStatus = useSelector(selectCountriesStatus)
  const savedCountryCodes = useSelector(selectSavedCountryCodes)
  const savedCount = useSelector(selectSavedCount)
  const tripPlans = useSelector(selectTripPlans)
  const tripPlanCount = useSelector(selectTripPlanCount)
  const countryFilterCode = String(searchParams.get('country') || '').trim().toUpperCase()
  const activeTab = searchParams.get('tab') === 'trips' || countryFilterCode ? 'trips' : 'countries'
  const totalSaved = savedCount + tripPlanCount

  useEffect(() => {
    if (totalSaved > 0) dispatch(fetchCountries())
  }, [dispatch, totalSaved])

  const countryByCode = useMemo(() => new Map(countries.flatMap((country) => [
    [country.code, country],
    [country.alpha2Code, country],
  ])), [countries])

  const savedCountries = useMemo(
    () => savedCountryCodes.map((code) => countryByCode.get(code)).filter(Boolean),
    [countryByCode, savedCountryCodes],
  )

  const isLoading = totalSaved > 0
    && countries.length === 0
    && (countriesStatus === COUNTRY_REQUEST_STATUS.idle || countriesStatus === COUNTRY_REQUEST_STATUS.loading)
  const isError = totalSaved > 0
    && countries.length === 0
    && countriesStatus === COUNTRY_REQUEST_STATUS.failed

  const selectTab = (tab) => {
    if (tab === 'trips') {
      setSearchParams(countryFilterCode ? { tab: 'trips', country: countryFilterCode } : { tab: 'trips' })
    } else {
      setSearchParams({})
    }
  }

  const clearCountryFilter = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', 'trips')
    nextParams.delete('country')
    setSearchParams(nextParams)
  }

  return (
    <div className={`saved-page shell${activeTab === 'trips' ? ' saved-page--trips' : ''}`}>
      <section className="saved-hero" aria-labelledby="saved-page-title">
        <div className="saved-hero__copy">
          <p className="eyebrow">Saved</p>
          <h1 id="saved-page-title">Keep the routes you want to return to.</h1>
          <p>
            Save countries while you explore, then turn inspiration into practical trip plans with dates,
            budget, preferences and travel notes.
          </p>
        </div>

        <div className="saved-hero__summary" aria-label={`${totalSaved} saved items`}>
          <span className="saved-hero__summary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M6.75 4.75A2.75 2.75 0 0 1 9.5 2h5A2.75 2.75 0 0 1 17.25 4.75V21L12 17.65 6.75 21V4.75Z"></path>
            </svg>
          </span>
          <strong>{totalSaved}</strong>
          <span>{totalSaved === 1 ? 'saved item' : 'saved items'}</span>
        </div>
      </section>

      <div className="saved-tabs" role="tablist" aria-label="Saved content">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'countries'}
          className={activeTab === 'countries' ? 'saved-tab saved-tab--active' : 'saved-tab'}
          onClick={() => selectTab('countries')}
        >
          Countries <span>{savedCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'trips'}
          className={activeTab === 'trips' ? 'saved-tab saved-tab--active' : 'saved-tab'}
          onClick={() => selectTab('trips')}
        >
          Trip plans <span>{tripPlanCount}</span>
        </button>
      </div>

      {isError && (
        <CountryDataError
          compact
          title="Your saved items are safe."
          message="We could not refresh the latest country information. Try the data request again without changing your saved content."
          onRetry={() => dispatch(fetchCountries({ force: true }))}
        />
      )}

      {activeTab === 'countries' && (
        <section className="saved-collection" aria-labelledby="saved-countries-title">
          <div className="section-heading saved-collection__heading">
            <div>
              <p className="eyebrow">Saved countries</p>
              <h2 id="saved-countries-title">Countries worth coming back to</h2>
            </div>
            {savedCount > 0 && (
              <button className="saved-clear-button" type="button" onClick={() => dispatch(clearSavedCountries())}>
                Clear countries
              </button>
            )}
          </div>

          {savedCount === 0 ? (
            <SavedEmptyState />
          ) : isLoading ? (
            <CountryGridSkeleton count={Math.min(savedCount, 9)} className="saved-country-grid" />
          ) : !isError && savedCountries.length > 0 ? (
            <SavedCountriesGrid countries={savedCountries} />
          ) : null}
        </section>
      )}

      {activeTab === 'trips' && (
        <section className="saved-collection" aria-labelledby="saved-trips-title">
          <div className="section-heading saved-collection__heading">
            <div>
              <p className="eyebrow">Saved trip plans</p>
              <h2 id="saved-trips-title">Your planned adventures</h2>
            </div>
            {tripPlanCount > 0 && (
              <button className="saved-clear-button" type="button" onClick={() => setClearTripsOpen(true)}>
                {countryFilterCode ? 'Clear all trip plans' : 'Clear trip plans'}
              </button>
            )}
          </div>

          {isLoading ? (
            <CountryGridSkeleton count={Math.min(Math.max(tripPlanCount, 1), 3)} />
          ) : (
            <SavedTripPlans
              plans={tripPlans}
              countriesByCode={countryByCode}
              onDeletePlan={setDeleteTarget}
              countryFilterCode={countryFilterCode}
              countryFilterName={countryByCode.get(countryFilterCode)?.name || tripPlans.find((plan) => plan.countryCode === countryFilterCode)?.countryName || countryFilterCode}
              onClearCountryFilter={clearCountryFilter}
            />
          )}
        </section>
      )}

      <TripDeleteConfirmModal
        plan={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          dispatch(deleteTripPlan(deleteTarget.id))
          setDeleteTarget(null)
        }}
      />
      <TripDeleteConfirmModal
        clearAll={clearTripsOpen}
        onClose={() => setClearTripsOpen(false)}
        onConfirm={() => {
          dispatch(clearTripPlans())
          setClearTripsOpen(false)
        }}
      />
    </div>
  )
}
