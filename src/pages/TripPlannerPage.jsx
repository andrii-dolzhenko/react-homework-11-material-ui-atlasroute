import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import TripBasicsForm from '../components/trip/TripBasicsForm'
import TravelerDetailsForm from '../components/trip/TravelerDetailsForm'
import TravelEssentials from '../components/trip/TravelEssentials'
import TripPlanSuccessModal from '../components/trip/TripPlanSuccessModal'
import TripDuplicateModal from '../components/trip/TripDuplicateModal'
import CountryDataLoader from '../components/CountryDataLoader'
import CountryDataError from '../components/CountryDataError'
import useTripCountryImage from '../hooks/useTripCountryImage.js'
import useExchangeRate from '../hooks/useExchangeRate'
import {
  COUNTRY_REQUEST_STATUS,
  fetchCountryByCode,
  selectCountryByCode,
  selectCountryDetailError,
  selectCountryDetailStatus,
} from '../redux/countriesSlice.js'
import {
  fetchCountryClimate,
  fetchCountryConditions,
  selectCountryClimate,
  selectCountryConditions,
} from '../redux/countryInsightsSlice.js'
import { saveTripPlan, selectTripPlanById, selectTripPlans } from '../redux/tripPlansSlice.js'
import { createTripPlanId, findMatchingTripPlan } from '../utils/tripPlan.js'

const emptyTraveler = {
  fullName: '',
  email: '',
  phone: '',
  departureCity: '',
}

const addDays = (value, amount) => {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date.toISOString().slice(0, 10)
}

const buildDefaultBasics = (plan) => {
  if (plan) {
    return {
      departureDate: plan.departureDate,
      returnDate: plan.returnDate,
      travelers: plan.travelers,
      budgetAmount: plan.budgetAmount,
      homeCurrency: plan.homeCurrency || 'UAH',
      tripStyles: plan.tripStyles || [],
      preferredRegions: plan.preferredRegions || '',
      notes: plan.notes || '',
    }
  }

  const departure = addDays(new Date(), 30)
  return {
    departureDate: departure,
    returnDate: addDays(`${departure}T00:00:00`, 7),
    travelers: 2,
    budgetAmount: '',
    homeCurrency: 'UAH',
    tripStyles: [],
    preferredRegions: '',
    notes: '',
  }
}

export default function TripPlannerPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit') || ''
  const existingPlan = useSelector((state) => selectTripPlanById(state, editId))
  const allTripPlans = useSelector(selectTripPlans)
  const country = useSelector((state) => selectCountryByCode(state, code))
  const status = useSelector((state) => selectCountryDetailStatus(state, code))
  const error = useSelector((state) => selectCountryDetailError(state, code))
  const conditions = useSelector((state) => selectCountryConditions(state, code))
  const climate = useSelector((state) => selectCountryClimate(state, code))

  const [step, setStep] = useState(1)
  const [tripBasics, setTripBasics] = useState(() => buildDefaultBasics(existingPlan))
  const [savedPlan, setSavedPlan] = useState(null)
  const [duplicatePlan, setDuplicatePlan] = useState(null)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [travelerDraft, setTravelerDraft] = useState(existingPlan?.traveler ? { ...emptyTraveler, ...existingPlan.traveler } : emptyTraveler)

  const routeCountryImage = typeof location.state?.countryImage === 'string'
    ? location.state.countryImage
    : ''
  const {
    image: tripImage,
    handleError: handleTripImageError,
  } = useTripCountryImage(country, {
    countryHeroImage: existingPlan?.countryHeroImage || routeCountryImage,
  })

  useEffect(() => {
    if (!country && status === COUNTRY_REQUEST_STATUS.idle) {
      dispatch(fetchCountryByCode({ code }))
    }
  }, [code, country, dispatch, status])

  useEffect(() => {
    if (!country) return
    dispatch(fetchCountryConditions(country))
    dispatch(fetchCountryClimate({ country, location: null }))
  }, [country, dispatch])

  useEffect(() => {
    if (!existingPlan) return
    setTripBasics(buildDefaultBasics(existingPlan))
    setTravelerDraft({ ...emptyTraveler, ...existingPlan.traveler })
  }, [existingPlan])

  const destinationCurrency = country?.currencies?.[0]?.code || ''
  const exchange = useExchangeRate(tripBasics.homeCurrency, destinationCurrency)
  const estimatedDestinationBudget = exchange.data?.rate && Number(tripBasics.budgetAmount) > 0
    ? Number(tripBasics.budgetAmount) * exchange.data.rate
    : 0

  const travelerInitialValues = useMemo(
    () => travelerDraft,
    [travelerDraft],
  )

  if (!country && (status === COUNTRY_REQUEST_STATUS.idle || status === COUNTRY_REQUEST_STATUS.loading)) {
    return (
      <div className="shell trip-planner-state">
        <CountryDataLoader compact title="Preparing your trip planner…" label="Loading destination details" />
      </div>
    )
  }

  if (!country && status === COUNTRY_REQUEST_STATUS.failed) {
    return (
      <div className="shell trip-planner-state">
        <CountryDataError
          compact
          title="This trip planner could not be opened."
          message={error || 'We could not load the selected country.'}
          onRetry={() => dispatch(fetchCountryByCode({ code, force: true }))}
        />
      </div>
    )
  }

  if (!country) return null

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  const handleBasicsSubmit = (values, { setSubmitting }) => {
    setTripBasics({
      ...values,
      travelers: Number(values.travelers),
      budgetAmount: Number(values.budgetAmount),
    })
    setStep(2)
    setSubmitting(false)
    scrollToTop()
  }

  const commitPlan = (plan) => {
    dispatch(saveTripPlan(plan))
    setDuplicatePlan(null)
    setPendingPlan(null)
    setSavedPlan(plan)
  }

  const handleTravelerSubmit = (traveler) => {
    setTravelerDraft(traveler)
    const timestamp = new Date().toISOString()
    const plan = {
      id: existingPlan?.id || createTripPlanId(country.code),
      countryCode: country.code,
      countryName: country.name,
      countryFlagEmoji: country.flagEmoji,
      countryFlagUrl: country.flagUrl,
      countryHeroImage: tripImage || existingPlan?.countryHeroImage || routeCountryImage || country.heroImage || '',
      ...tripBasics,
      destinationCurrency,
      exchangeRate: exchange.data?.rate || 0,
      estimatedDestinationBudget,
      traveler,
      createdAt: existingPlan?.createdAt || timestamp,
      updatedAt: timestamp,
    }

    if (!existingPlan) {
      const match = findMatchingTripPlan(allTripPlans, plan)
      if (match) {
        setDuplicatePlan(match)
        setPendingPlan(plan)
        return
      }
    }

    commitPlan(plan)
  }

  const handleChangeDates = () => {
    setDuplicatePlan(null)
    setPendingPlan(null)
    setStep(1)
    scrollToTop()
  }

  return (
    <main className="trip-planner-page">
      <section className={`shell trip-planner-hero${tripImage ? '' : ' trip-planner-hero--flag'}`}>
        {tripImage ? (
          <img
            key={tripImage}
            src={tripImage}
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={handleTripImageError}
          />
        ) : <div>{country.flagEmoji}</div>}
        <div className="trip-planner-hero__shade" />
        <Link className="back-button" to={`/countries/${country.code}`}>← Back to {country.name}</Link>
        <div className="trip-planner-hero__copy">
          <p className="eyebrow">{country.name}</p>
          <h1>Plan your trip</h1>
          <p>Turn inspiration into a practical travel plan you can save, share, print and add to your calendar.</p>
        </div>
      </section>

      <div className="shell trip-planner-stepper" aria-label="Trip planner progress">
        <span className={step >= 1 ? 'trip-step trip-step--active' : 'trip-step'}><i>{step > 1 ? '✓' : '1'}</i><strong>Trip basics</strong><small>Dates, budget & interests</small></span>
        <b aria-hidden="true" />
        <span className={step >= 2 ? 'trip-step trip-step--active' : 'trip-step'}><i>2</i><strong>Traveler details</strong><small>Useful contact information</small></span>
      </div>

      <section className={`shell trip-planner-content${step === 2 ? ' trip-planner-content--step-two' : ''}`}>
        <div className="trip-planner-content__main">
          {step === 1 ? (
            <TripBasicsForm
              country={country}
              initialValues={tripBasics}
              exchange={exchange}
              destinationCurrency={destinationCurrency}
              onSubmit={handleBasicsSubmit}
              onCancel={() => navigate(`/countries/${country.code}`)}
            />
          ) : (
            <TravelerDetailsForm
              country={country}
              countryImage={tripImage}
              tripBasics={tripBasics}
              initialValues={travelerInitialValues}
              destinationCurrency={destinationCurrency}
              estimatedDestinationBudget={estimatedDestinationBudget}
              onBack={() => setStep(1)}
              onSubmit={handleTravelerSubmit}
            />
          )}
        </div>

        {step === 1 && (
          <TravelEssentials
            country={country}
            conditions={conditions}
            climate={climate}
            departureDate={tripBasics.departureDate}
            homeCurrency={tripBasics.homeCurrency}
            exchange={exchange}
            budgetAmount={tripBasics.budgetAmount}
          />
        )}
      </section>

      <TripDuplicateModal
        existingPlan={duplicatePlan}
        candidatePlan={pendingPlan}
        onClose={() => { setDuplicatePlan(null); setPendingPlan(null) }}
        onChangeDates={handleChangeDates}
        onViewExisting={() => navigate(`/saved/trips/${duplicatePlan.id}`)}
        onCreateDuplicate={() => pendingPlan && commitPlan(pendingPlan)}
      />
      <TripPlanSuccessModal
        plan={savedPlan}
        onClose={() => setSavedPlan(null)}
        onContinue={() => navigate(`/countries/${country.code}`)}
      />
    </main>
  )
}
