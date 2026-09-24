import test from 'node:test'
import assert from 'node:assert/strict'
import { filterAndSortSavedTrips } from '../src/utils/savedTripFilters.js'
import { createTripReadiness } from '../src/utils/tripReadiness.js'

const makePlan = ({
  id,
  countryName,
  departureDate,
  returnDate,
  createdAt,
  updatedAt,
  readiness,
}) => {
  const plan = {
    id,
    countryCode: id.slice(0, 3).toUpperCase(),
    countryName,
    departureDate,
    returnDate,
    travelers: 1,
    travelerRoster: [{ id: `${id}-traveler-1`, fullName: 'Alex' }],
    createdAt,
    updatedAt,
  }
  return { ...plan, readiness: readiness || createTripReadiness(plan) }
}

const plans = [
  makePlan({
    id: 'arg-1',
    countryName: 'Argentina',
    departureDate: '2026-10-21',
    returnDate: '2026-10-27',
    createdAt: '2026-09-19T09:00:00.000Z',
    updatedAt: '2026-09-22T09:00:00.000Z',
  }),
  makePlan({
    id: 'jpn-1',
    countryName: 'Japan',
    departureDate: '2026-11-10',
    returnDate: '2026-11-18',
    createdAt: '2026-09-21T09:00:00.000Z',
    updatedAt: '2026-09-21T09:00:00.000Z',
  }),
  makePlan({
    id: 'ita-1',
    countryName: 'Italy',
    departureDate: '2026-08-02',
    returnDate: '2026-08-12',
    createdAt: '2026-09-18T09:00:00.000Z',
    updatedAt: '2026-09-20T09:00:00.000Z',
  }),
]

test('saved trip timing filters separate upcoming and past plans', () => {
  const upcoming = filterAndSortSavedTrips(plans, { period: 'upcoming', today: '2026-09-22' })
  const past = filterAndSortSavedTrips(plans, { period: 'past', today: '2026-09-22' })

  assert.deepEqual(upcoming.map((plan) => plan.countryName), ['Argentina', 'Japan'])
  assert.deepEqual(past.map((plan) => plan.countryName), ['Italy'])
})

test('saved trip sorting supports recent, trip date and destination order', () => {
  assert.deepEqual(
    filterAndSortSavedTrips(plans, { sort: 'updated-desc', today: '2026-09-22' }).map((plan) => plan.countryName),
    ['Argentina', 'Japan', 'Italy'],
  )
  assert.deepEqual(
    filterAndSortSavedTrips(plans, { sort: 'created-desc', today: '2026-09-22' }).map((plan) => plan.countryName),
    ['Japan', 'Argentina', 'Italy'],
  )
  assert.deepEqual(
    filterAndSortSavedTrips(plans, { sort: 'trip-soonest', today: '2026-09-22' }).map((plan) => plan.countryName),
    ['Argentina', 'Japan', 'Italy'],
  )
  assert.deepEqual(
    filterAndSortSavedTrips(plans, { sort: 'destination-asc', today: '2026-09-22' }).map((plan) => plan.countryName),
    ['Argentina', 'Italy', 'Japan'],
  )
})

test('readiness filter uses each trip readiness status', () => {
  const completePlan = makePlan({
    id: 'aus-1',
    countryName: 'Australia',
    departureDate: '2026-10-01',
    returnDate: '2026-10-12',
    createdAt: '2026-09-20T09:00:00.000Z',
    updatedAt: '2026-09-22T10:00:00.000Z',
  })

  completePlan.readiness.started = true
  Object.keys(completePlan.readiness.tripTasks).forEach((key) => {
    completePlan.readiness.tripTasks[key] = true
  })
  Object.keys(completePlan.readiness.travelers[0].tasks).forEach((key) => {
    completePlan.readiness.travelers[0].tasks[key] = true
  })

  const filtered = filterAndSortSavedTrips([...plans, completePlan], {
    readiness: 'complete',
    today: '2026-09-22',
  })

  assert.deepEqual(filtered.map((plan) => plan.countryName), ['Australia'])
})


test('country context filter limits saved trips without changing other filters', () => {
  const extraArgentina = makePlan({
    id: 'arg-2',
    countryName: 'Argentina',
    departureDate: '2027-01-10',
    returnDate: '2027-01-18',
    createdAt: '2026-09-22T10:00:00.000Z',
    updatedAt: '2026-09-22T10:00:00.000Z',
  })
  const filtered = filterAndSortSavedTrips([...plans, extraArgentina], {
    countryCode: 'arg',
    sort: 'trip-soonest',
    today: '2026-09-22',
  })
  assert.deepEqual(filtered.map((plan) => plan.id), ['arg-1', 'arg-2'])
})
