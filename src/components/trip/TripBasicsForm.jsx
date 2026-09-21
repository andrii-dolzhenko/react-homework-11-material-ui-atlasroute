import { ErrorMessage, Field, Form, Formik } from 'formik'
import TravelAnimatedIcon from './TravelAnimatedIcon.jsx'
import { HOME_CURRENCY_OPTIONS, TRIP_STYLE_OPTIONS, formatMoney } from '../../utils/tripPlan.js'
import { todayForDateInput, tripBasicsSchema } from '../../validation/tripPlanSchema.js'

const getFieldClassName = (touched, error) => (
  touched && error ? 'trip-field__control trip-field__control--error' : 'trip-field__control'
)

export default function TripBasicsForm({
  country,
  initialValues,
  exchange,
  destinationCurrency,
  onSubmit,
  onCancel,
}) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={tripBasicsSchema}
      enableReinitialize
      onSubmit={onSubmit}
    >
      {({ values, touched, errors, isSubmitting }) => {
        const estimatedDestinationBudget = exchange?.data?.rate && Number(values.budgetAmount) > 0
          ? Number(values.budgetAmount) * exchange.data.rate
          : 0

        return (
          <Form className="trip-form" noValidate>
            <div className="trip-form__heading">
              <TravelAnimatedIcon name="compass" className="trip-form__icon" />
              <div>
                <p className="eyebrow">Step 1 · Trip basics</p>
                <h2>Plan your {country.name} trip</h2>
                <p>Create a travel plan around your dates, budget and interests.</p>
              </div>
            </div>

            <div className="trip-form__grid trip-form__grid--three">
              <div className="trip-field">
                <label htmlFor="trip-destination">Destination</label>
                <div className="trip-field__locked">
                  {country.flagEmoji && <span aria-hidden="true">{country.flagEmoji}</span>}
                  <strong>{country.name}</strong>
                  <span aria-hidden="true">⌁</span>
                </div>
                <small>Destination is set from the country you selected.</small>
              </div>

              <div className="trip-field">
                <label htmlFor="trip-departure">Departure date</label>
                <Field
                  className={getFieldClassName(touched.departureDate, errors.departureDate)}
                  id="trip-departure"
                  name="departureDate"
                  type="date"
                  min={todayForDateInput()}
                  aria-invalid={Boolean(touched.departureDate && errors.departureDate)}
                />
                <ErrorMessage className="trip-field__error" component="p" name="departureDate" />
              </div>

              <div className="trip-field">
                <label htmlFor="trip-return">Return date</label>
                <Field
                  className={getFieldClassName(touched.returnDate, errors.returnDate)}
                  id="trip-return"
                  name="returnDate"
                  type="date"
                  min={values.departureDate || todayForDateInput()}
                  aria-invalid={Boolean(touched.returnDate && errors.returnDate)}
                />
                <ErrorMessage className="trip-field__error" component="p" name="returnDate" />
              </div>
            </div>

            <div className="trip-form__grid trip-form__grid--two">
              <div className="trip-field">
                <label htmlFor="trip-travelers">Travelers</label>
                <Field
                  as="select"
                  className={getFieldClassName(touched.travelers, errors.travelers)}
                  id="trip-travelers"
                  name="travelers"
                >
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>{count} traveler{count === 1 ? '' : 's'}</option>
                  ))}
                </Field>
                <ErrorMessage className="trip-field__error" component="p" name="travelers" />
              </div>

              <div className="trip-field trip-field--budget">
                <label htmlFor="trip-budget">Total budget</label>
                <div className="trip-budget-input">
                  <Field
                    className={getFieldClassName(touched.budgetAmount, errors.budgetAmount)}
                    id="trip-budget"
                    name="budgetAmount"
                    type="number"
                    min="500"
                    step="1"
                    inputMode="decimal"
                    placeholder="50,000"
                  />
                  <Field as="select" name="homeCurrency" aria-label="Home currency">
                    {HOME_CURRENCY_OPTIONS.map((currency) => <option key={currency}>{currency}</option>)}
                  </Field>
                </div>
                <ErrorMessage className="trip-field__error" component="p" name="budgetAmount" />
                <small className="trip-budget-hint">Use 500 or more in the selected currency. This is a planner guardrail, not an entry requirement.</small>
                {exchange?.status === 'succeeded' && estimatedDestinationBudget > 0 && destinationCurrency && (
                  <div className="trip-budget-conversion" aria-live="polite">
                    <small>Estimated equivalent</small>
                    <strong>≈ {formatMoney(estimatedDestinationBudget, destinationCurrency)}</strong>
                    <span>Live reference rate · actual card/bank rates may differ.</span>
                  </div>
                )}
              </div>
            </div>

            <fieldset className="trip-style-fieldset">
              <legend>Trip style <span>(choose one or more)</span></legend>
              <div className="trip-style-options">
                {TRIP_STYLE_OPTIONS.map((style) => (
                  <label key={style} className={values.tripStyles.includes(style) ? 'trip-style-option trip-style-option--selected' : 'trip-style-option'}>
                    <Field type="checkbox" name="tripStyles" value={style} />
                    <span>{style}</span>
                  </label>
                ))}
              </div>
              <ErrorMessage className="trip-field__error" component="p" name="tripStyles" />
            </fieldset>

            <div className="trip-form__grid trip-form__grid--two">
              <div className="trip-field">
                <label htmlFor="trip-regions">Preferred regions or cities <span>(optional)</span></label>
                <Field
                  className={getFieldClassName(touched.preferredRegions, errors.preferredRegions)}
                  id="trip-regions"
                  name="preferredRegions"
                  type="text"
                  placeholder={`e.g. ${country.capital || country.name}, another city or region`}
                />
                <small>Separate destinations with commas.</small>
                <ErrorMessage className="trip-field__error" component="p" name="preferredRegions" />
              </div>

              <div className="trip-field">
                <label htmlFor="trip-notes">Additional notes <span>(optional)</span></label>
                <Field
                  as="textarea"
                  className={getFieldClassName(touched.notes, errors.notes)}
                  id="trip-notes"
                  name="notes"
                  rows="4"
                  placeholder="Must-see places, accessibility needs, ideas or reminders…"
                />
                <div className="trip-field__counter">{values.notes.length}/500</div>
                <ErrorMessage className="trip-field__error" component="p" name="notes" />
              </div>
            </div>

            <div className="trip-form__actions">
              <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                Continue to traveler details <span aria-hidden="true">→</span>
              </button>
            </div>
          </Form>
        )
      }}
    </Formik>
  )
}
