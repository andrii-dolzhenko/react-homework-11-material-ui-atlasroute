import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material'
import { useForm, useWatch } from 'react-hook-form'
import { formatMoney, formatTripDate, getTripDurationDays } from '../../utils/tripPlan.js'
import TripUiIcon from './TripUiIcon.jsx'
import TravelAnimatedIcon from './TravelAnimatedIcon.jsx'
import TravelerReductionModal from './TravelerReductionModal.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[0-9\s().-]{7,22}$/
const personNamePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u

const fieldClassName = (error) => (
  error ? 'trip-field__control trip-field__control--error' : 'trip-field__control'
)

const travelerTitle = (traveler, index) => {
  const name = String(traveler?.fullName || '').trim()
  return name ? `Traveler ${index + 1} · ${name}` : `Traveler ${index + 1}`
}

export default function TravelerDetailsForm({
  country,
  countryImage,
  tripBasics,
  initialValues,
  destinationCurrency,
  estimatedDestinationBudget,
  onBack,
  onTravelersChange,
  onSubmit,
}) {
  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setFocus,
  } = useForm({
    defaultValues: initialValues,
    mode: 'onBlur',
    shouldFocusError: false,
  })

  const [expandedTravelers, setExpandedTravelers] = useState(() => new Set([1]))
  const [pendingTravelerRemoval, setPendingTravelerRemoval] = useState(null)
  const watchedTravelers = useWatch({ control, name: 'travelers' }) || initialValues.travelers || []

  useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  const duration = getTripDurationDays(tripBasics.departureDate, tripBasics.returnDate)
  const travelerCount = Math.max(1, Number(tripBasics.travelers) || 1)
  const additionalTravelers = useMemo(
    () => Array.from({ length: Math.max(0, travelerCount - 1) }, (_, index) => index + 1),
    [travelerCount],
  )

  const toggleTraveler = (index) => {
    setExpandedTravelers((current) => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const requestTravelerRemoval = (event, index) => {
    event.preventDefault()
    event.stopPropagation()
    const traveler = getValues(`travelers.${index}`) || watchedTravelers[index] || {}
    setPendingTravelerRemoval({ traveler, index })
  }

  const handleTravelerRemoveKeyDown = (event, index) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    requestTravelerRemoval(event, index)
  }

  const confirmTravelerRemoval = () => {
    if (!pendingTravelerRemoval) return
    const removeIndex = pendingTravelerRemoval.index
    const currentTravelers = getValues('travelers').slice(0, travelerCount)
    const nextTravelers = currentTravelers.filter((_, index) => index !== removeIndex)

    reset({ travelers: nextTravelers })
    setExpandedTravelers((current) => new Set(
      [...current]
        .filter((index) => index !== removeIndex)
        .map((index) => (index > removeIndex ? index - 1 : index)),
    ))
    setPendingTravelerRemoval(null)
    onTravelersChange?.(nextTravelers)
  }

  const handleInvalid = (formErrors) => {
    const travelerErrors = Array.isArray(formErrors.travelers) ? formErrors.travelers : []
    const firstInvalidIndex = travelerErrors.findIndex(Boolean)
    if (firstInvalidIndex < 0) return

    const errorGroup = travelerErrors[firstInvalidIndex] || {}
    const fieldName = ['fullName', 'email', 'phone', 'departureCity'].find((name) => errorGroup[name]) || 'fullName'

    if (firstInvalidIndex > 0) {
      setExpandedTravelers((current) => new Set([...current, firstInvalidIndex]))
    }

    window.setTimeout(() => {
      document.querySelector(`[data-traveler-index="${firstInvalidIndex}"]`)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      })
      setFocus(`travelers.${firstInvalidIndex}.${fieldName}`)
    }, firstInvalidIndex > 0 ? 100 : 0)
  }

  const submitTravelers = (values) => onSubmit(values.travelers.slice(0, travelerCount))
  const primaryErrors = errors.travelers?.[0] || {}
  const primaryTraveler = watchedTravelers[0] || {}

  return (
    <div className="trip-step-two-layout">
      <form className="trip-form trip-form--traveler" noValidate onSubmit={handleSubmit(submitTravelers, handleInvalid)}>
        <div className="trip-form__heading">
          <span className="trip-form__icon" aria-hidden="true"><TripUiIcon name="passport" size={25} /></span>
          <div>
            <p className="eyebrow">Step 2 · Traveler details</p>
            <h2>Traveler information</h2>
            <p>Keep useful contact details with this saved trip. Everything stays in your browser storage.</p>
          </div>
        </div>

        <section className="trip-traveler-primary" aria-labelledby="primary-traveler-title">
          <input type="hidden" {...register('travelers.0.id')} />
          <div className="trip-traveler-primary__heading">
            <span className="trip-traveler-heading-icon" aria-hidden="true"><TripUiIcon name="person" size={18} /></span>
            <strong id="primary-traveler-title">{travelerTitle(primaryTraveler, 0)}</strong>
            <span className="trip-traveler-primary__badge">Primary traveler</span>
          </div>

          <div className="trip-form__grid trip-form__grid--two trip-traveler-fields">
            <div className="trip-field">
              <label htmlFor="traveler-name">Full name</label>
              <input
                className={fieldClassName(primaryErrors.fullName)}
                id="traveler-name"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(primaryErrors.fullName)}
                {...register('travelers.0.fullName', {
                  required: 'Enter the traveler name',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 80, message: 'Name must be 80 characters or less' },
                  validate: {
                    trimmedLength: (value) => value.trim().length >= 2 || 'Enter the traveler name',
                    characters: (value) => personNamePattern.test(value.trim()) || 'Use letters, spaces, apostrophes or hyphens',
                  },
                })}
              />
              {primaryErrors.fullName && <p className="trip-field__error">{primaryErrors.fullName.message}</p>}
            </div>

            <div className="trip-field">
              <label htmlFor="traveler-email">Email</label>
              <input
                className={fieldClassName(primaryErrors.email)}
                id="traveler-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(primaryErrors.email)}
                {...register('travelers.0.email', {
                  required: 'Enter an email address',
                  maxLength: { value: 254, message: 'Email must be 254 characters or less' },
                  pattern: { value: emailPattern, message: 'Enter a valid email address' },
                })}
              />
              {primaryErrors.email && <p className="trip-field__error">{primaryErrors.email.message}</p>}
            </div>

            <div className="trip-field">
              <label htmlFor="traveler-phone">Phone <span>(optional)</span></label>
              <input
                className={fieldClassName(primaryErrors.phone)}
                id="traveler-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+380 00 000 00 00"
                aria-invalid={Boolean(primaryErrors.phone)}
                {...register('travelers.0.phone', {
                  pattern: { value: phonePattern, message: 'Enter a valid phone number' },
                })}
              />
              {primaryErrors.phone && <p className="trip-field__error">{primaryErrors.phone.message}</p>}
            </div>

            <div className="trip-field">
              <label htmlFor="traveler-departure-city">Departure city</label>
              <input
                className={fieldClassName(primaryErrors.departureCity)}
                id="traveler-departure-city"
                type="text"
                placeholder="Kyiv"
                aria-invalid={Boolean(primaryErrors.departureCity)}
                {...register('travelers.0.departureCity', {
                  required: 'Enter your departure city',
                  minLength: { value: 2, message: 'City name must be at least 2 characters' },
                  maxLength: { value: 80, message: 'City name must be 80 characters or less' },
                  validate: (value) => value.trim().length >= 2 || 'Enter your departure city',
                })}
              />
              {primaryErrors.departureCity && <p className="trip-field__error">{primaryErrors.departureCity.message}</p>}
            </div>
          </div>
        </section>

        {additionalTravelers.length > 0 && (
          <div className="trip-additional-travelers" aria-label="Additional travelers">
            {additionalTravelers.map((index) => {
              const traveler = watchedTravelers[index] || {}
              const travelerErrors = errors.travelers?.[index] || {}
              const expanded = expandedTravelers.has(index)
              return (
                <Accordion
                  className="trip-traveler-accordion"
                  expanded={expanded}
                  disableGutters
                  elevation={0}
                  key={traveler.id || `traveler-${index + 1}`}
                  data-traveler-index={index}
                  onChange={() => toggleTraveler(index)}
                >
                  <AccordionSummary
                    className="trip-traveler-accordion__summary"
                    expandIcon={<span className="trip-traveler-accordion__chevron"><TripUiIcon name="chevronDown" size={18} /></span>}
                    aria-controls={`traveler-${index + 1}-content`}
                    id={`traveler-${index + 1}-header`}
                  >
                    <span className="trip-traveler-heading-icon" aria-hidden="true"><TripUiIcon name="person" size={18} /></span>
                    <strong>{travelerTitle(traveler, index)}</strong>
                    <span
                      className="trip-traveler-accordion__remove"
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${traveler.fullName?.trim() || `Traveler ${index + 1}`}`}
                      title={`Remove ${traveler.fullName?.trim() || `Traveler ${index + 1}`}`}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => requestTravelerRemoval(event, index)}
                      onKeyDown={(event) => handleTravelerRemoveKeyDown(event, index)}
                    >
                      <TripUiIcon name="trash" size={17} />
                    </span>
                  </AccordionSummary>
                  <AccordionDetails className="trip-traveler-accordion__details" id={`traveler-${index + 1}-content`}>
                    <input type="hidden" {...register(`travelers.${index}.id`)} />
                    <div className="trip-form__grid trip-form__grid--two trip-traveler-fields">
                      <div className="trip-field">
                        <label htmlFor={`traveler-${index + 1}-name`}>Full name</label>
                        <input
                          className={fieldClassName(travelerErrors.fullName)}
                          id={`traveler-${index + 1}-name`}
                          type="text"
                          autoComplete="name"
                          aria-invalid={Boolean(travelerErrors.fullName)}
                          {...register(`travelers.${index}.fullName`, {
                            required: 'Enter the traveler name',
                            minLength: { value: 2, message: 'Name must be at least 2 characters' },
                            maxLength: { value: 80, message: 'Name must be 80 characters or less' },
                            validate: {
                              trimmedLength: (value) => value.trim().length >= 2 || 'Enter the traveler name',
                              characters: (value) => personNamePattern.test(value.trim()) || 'Use letters, spaces, apostrophes or hyphens',
                            },
                          })}
                        />
                        {travelerErrors.fullName && <p className="trip-field__error">{travelerErrors.fullName.message}</p>}
                      </div>

                      <div className="trip-field">
                        <label htmlFor={`traveler-${index + 1}-email`}>Email <span>(optional)</span></label>
                        <input
                          className={fieldClassName(travelerErrors.email)}
                          id={`traveler-${index + 1}-email`}
                          type="email"
                          autoComplete="email"
                          aria-invalid={Boolean(travelerErrors.email)}
                          {...register(`travelers.${index}.email`, {
                            maxLength: { value: 254, message: 'Email must be 254 characters or less' },
                            validate: (value) => !value?.trim() || emailPattern.test(value.trim()) || 'Enter a valid email address',
                          })}
                        />
                        {travelerErrors.email && <p className="trip-field__error">{travelerErrors.email.message}</p>}
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </div>
        )}

        <div className="trip-form__privacy-note">
          <strong>No account required.</strong>
          <span>Traveler details are stored locally with the trip plan and are not sent to AtlasRoute.</span>
        </div>

        <div className="trip-form__actions">
          <button className="secondary-button" type="button" onClick={() => onBack(getValues().travelers.slice(0, travelerCount))}>← Back</button>
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

      <TravelerReductionModal
        traveler={pendingTravelerRemoval?.traveler}
        travelerNumber={pendingTravelerRemoval ? pendingTravelerRemoval.index + 1 : undefined}
        onClose={() => setPendingTravelerRemoval(null)}
        onConfirm={confirmTravelerRemoval}
      />
    </div>
  )
}
