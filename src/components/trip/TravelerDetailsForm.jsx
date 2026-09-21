import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { formatMoney, formatTripDate, getTripDurationDays } from '../../utils/tripPlan.js'
import TripUiIcon from './TripUiIcon.jsx'
import TravelAnimatedIcon from './TravelAnimatedIcon.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[0-9\s().-]{7,22}$/

export default function TravelerDetailsForm({
  country,
  countryImage,
  tripBasics,
  initialValues,
  destinationCurrency,
  estimatedDestinationBudget,
  onBack,
  onSubmit,
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: initialValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  const duration = getTripDurationDays(tripBasics.departureDate, tripBasics.returnDate)

  return (
    <div className="trip-step-two-layout">
      <form className="trip-form trip-form--traveler" noValidate onSubmit={handleSubmit(onSubmit)}>
        <div className="trip-form__heading">
          <span className="trip-form__icon" aria-hidden="true"><TripUiIcon name="passport" size={25} /></span>
          <div>
            <p className="eyebrow">Step 2 · Traveler details</p>
            <h2>Traveler information</h2>
            <p>Keep useful contact details with this saved trip. Everything stays in your browser storage.</p>
          </div>
        </div>

        <div className="trip-form__grid trip-form__grid--two">
          <div className="trip-field">
            <label htmlFor="traveler-name">Full name</label>
            <input
              className={errors.fullName ? 'trip-field__control trip-field__control--error' : 'trip-field__control'}
              id="traveler-name"
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              {...register('fullName', {
                required: 'Enter the traveler name',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 50, message: 'Name must be 50 characters or less' },
                validate: (value) => value.trim().length >= 2 || 'Enter the traveler name',
              })}
            />
            {errors.fullName && <p className="trip-field__error">{errors.fullName.message}</p>}
          </div>

          <div className="trip-field">
            <label htmlFor="traveler-email">Email</label>
            <input
              className={errors.email ? 'trip-field__control trip-field__control--error' : 'trip-field__control'}
              id="traveler-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email', {
                required: 'Enter an email address',
                pattern: { value: emailPattern, message: 'Enter a valid email address' },
              })}
            />
            {errors.email && <p className="trip-field__error">{errors.email.message}</p>}
          </div>

          <div className="trip-field">
            <label htmlFor="traveler-phone">Phone <span>(optional)</span></label>
            <input
              className={errors.phone ? 'trip-field__control trip-field__control--error' : 'trip-field__control'}
              id="traveler-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+380 00 000 00 00"
              aria-invalid={Boolean(errors.phone)}
              {...register('phone', {
                pattern: { value: phonePattern, message: 'Enter a valid phone number' },
              })}
            />
            {errors.phone && <p className="trip-field__error">{errors.phone.message}</p>}
          </div>

          <div className="trip-field">
            <label htmlFor="traveler-departure-city">Departure city</label>
            <input
              className={errors.departureCity ? 'trip-field__control trip-field__control--error' : 'trip-field__control'}
              id="traveler-departure-city"
              type="text"
              placeholder="Kyiv"
              aria-invalid={Boolean(errors.departureCity)}
              {...register('departureCity', {
                required: 'Enter your departure city',
                minLength: { value: 2, message: 'City name must be at least 2 characters' },
                maxLength: { value: 80, message: 'City name must be 80 characters or less' },
                validate: (value) => value.trim().length >= 2 || 'Enter your departure city',
              })}
            />
            {errors.departureCity && <p className="trip-field__error">{errors.departureCity.message}</p>}
          </div>
        </div>

        <div className="trip-form__privacy-note">
          <strong>No account required.</strong>
          <span>Traveler details are stored locally with the trip plan and are not sent to AtlasRoute.</span>
        </div>

        <div className="trip-form__actions">
          <button className="secondary-button" type="button" onClick={onBack}>← Back</button>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save trip plan'} <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      <aside className="trip-summary-card" aria-labelledby="trip-summary-title">
        <div className={`trip-summary-card__visual${countryImage ? '' : ' trip-summary-card__visual--flag'}`}>
          {countryImage ? (
            <img key={countryImage} src={countryImage} alt="" loading="eager" decoding="async" />
          ) : <span aria-hidden="true">{country.flagEmoji}</span>}
        </div>
        <div className="trip-summary-card__content">
          <div className="trip-summary-card__heading">
            <TravelAnimatedIcon name="airplane" size={46} className="trip-summary-card__icon" />
            <div>
              <h2 id="trip-summary-title">Trip summary</h2>
              <p>What you have planned so far.</p>
            </div>
          </div>
          <dl>
            <div><dt>Destination</dt><dd>{country.flagEmoji} {country.name}</dd></div>
            <div><dt>Travel dates</dt><dd>{formatTripDate(tripBasics.departureDate)} – {formatTripDate(tripBasics.returnDate)}<small>{duration} days</small></dd></div>
            <div><dt>Travelers</dt><dd>{tripBasics.travelers}</dd></div>
            <div><dt>Budget</dt><dd>{formatMoney(tripBasics.budgetAmount, tripBasics.homeCurrency)}{estimatedDestinationBudget > 0 && destinationCurrency ? <small>≈ {formatMoney(estimatedDestinationBudget, destinationCurrency)}</small> : null}</dd></div>
            <div><dt>Trip style</dt><dd>{tripBasics.tripStyles.join(', ')}</dd></div>
            {tripBasics.preferredRegions && <div><dt>Places</dt><dd>{tripBasics.preferredRegions}</dd></div>}
          </dl>
        </div>
      </aside>
    </div>
  )
}
