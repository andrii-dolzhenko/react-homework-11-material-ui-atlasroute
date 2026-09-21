import test from 'node:test'
import assert from 'node:assert/strict'
import tripPlansReducer, {
  clearTripPlans,
  deleteTripPlan,
  normalizeTripPlan,
  saveTripPlan,
  selectTripPlansByCountry,
} from '../src/redux/tripPlansSlice.js'
import {
  buildTripIcs,
  buildTripShareText,
  createTripPlanId,
  findMatchingTripPlan,
  getTripDurationDays,
} from '../src/utils/tripPlan.js'
import { tripBasicsSchema } from '../src/validation/tripPlanSchema.js'

const samplePlan = {
  id: 'aus-1',
  countryCode: 'aus',
  countryName: 'Australia',
  countryFlagEmoji: '🇦🇺',
  departureDate: '2026-10-03',
  returnDate: '2026-10-14',
  travelers: 2,
  budgetAmount: 50000,
  homeCurrency: 'uah',
  destinationCurrency: 'aud',
  exchangeRate: 0.029,
  estimatedDestinationBudget: 1450,
  tripStyles: ['Nature', 'Cities', 'Nature'],
  preferredRegions: 'Sydney, Melbourne',
  notes: 'Visit the coast',
  traveler: {
    fullName: ' Andrii ',
    email: 'andrii@example.com',
    phone: '+380 00 000 00 00',
    departureCity: ' Kyiv ',
  },
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
}

test('trip plan normalization keeps serializable travel data clean', () => {
  const plan = normalizeTripPlan(samplePlan)
  assert.equal(plan.countryCode, 'AUS')
  assert.equal(plan.homeCurrency, 'UAH')
  assert.equal(plan.traveler.fullName, 'Andrii')
  assert.equal(plan.traveler.departureCity, 'Kyiv')
  assert.deepEqual(plan.tripStyles, ['Nature', 'Cities'])
})

test('trip plan slice saves, updates, deletes and clears plans', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(samplePlan))
  assert.equal(state.plans.length, 1)
  assert.equal(state.plans[0].budgetAmount, 50000)

  state = tripPlansReducer(state, saveTripPlan({ ...samplePlan, budgetAmount: 60000 }))
  assert.equal(state.plans.length, 1)
  assert.equal(state.plans[0].budgetAmount, 60000)

  state = tripPlansReducer(state, deleteTripPlan('aus-1'))
  assert.equal(state.plans.length, 0)

  state = tripPlansReducer(state, saveTripPlan(samplePlan))
  state = tripPlansReducer(state, clearTripPlans())
  assert.deepEqual(state.plans, [])
})


test('trip plan selector returns only plans for the requested country', () => {
  const aus = normalizeTripPlan(samplePlan)
  const fra = normalizeTripPlan({
    ...samplePlan,
    id: 'fra-1',
    countryCode: 'FRA',
    countryName: 'France',
  })
  const state = { tripPlans: { plans: [fra, aus] } }

  assert.deepEqual(selectTripPlansByCountry(state, 'aus').map((plan) => plan.id), ['aus-1'])
  assert.deepEqual(selectTripPlansByCountry(state, 'FRA').map((plan) => plan.id), ['fra-1'])
  assert.deepEqual(selectTripPlansByCountry(state, ''), [])
})

test('trip plan utilities build duration, share text and calendar data', () => {
  assert.equal(getTripDurationDays('2026-10-03', '2026-10-14'), 12)
  assert.equal(createTripPlanId('AUS', 1234), 'aus-1234')

  const shareText = buildTripShareText(samplePlan)
  assert.match(shareText, /Australia trip plan/)
  assert.match(shareText, /2 travelers/)

  const ics = buildTripIcs(samplePlan)
  assert.match(ics, /BEGIN:VCALENDAR/)
  assert.match(ics, /DTSTART;VALUE=DATE:20261003/)
  assert.match(ics, /DTEND;VALUE=DATE:20261015/)
})


test('matching trip plan detection only flags the same country and exact dates', () => {
  const normalized = normalizeTripPlan(samplePlan)
  const match = findMatchingTripPlan([normalized], {
    countryCode: 'AUS',
    departureDate: '2026-10-03',
    returnDate: '2026-10-14',
  })
  assert.equal(match?.id, 'aus-1')

  assert.equal(findMatchingTripPlan([normalized], {
    countryCode: 'AUS',
    departureDate: '2026-10-04',
    returnDate: '2026-10-14',
  }), null)
})

test('trip basics schema rejects implausibly tiny planning budgets', async () => {
  const values = {
    departureDate: '2026-10-03',
    returnDate: '2026-10-14',
    travelers: 2,
    budgetAmount: 499,
    homeCurrency: 'UAH',
    tripStyles: ['Nature'],
    preferredRegions: '',
    notes: '',
  }

  await assert.rejects(() => tripBasicsSchema.validate(values), /at least 500/i)
  await assert.doesNotReject(() => tripBasicsSchema.validate({ ...values, budgetAmount: 500 }))
})
