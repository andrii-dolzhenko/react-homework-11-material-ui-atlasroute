import test from 'node:test'
import assert from 'node:assert/strict'
import tripPlansReducer, {
  deleteTripPlan,
  normalizeTripPlan,
  saveTripPlan,
  setTravelerReadinessTask,
  setTripReadinessTask,
} from '../src/redux/tripPlansSlice.js'
import {
  TRAVELER_READINESS_TASKS,
  TRIP_READINESS_TASKS,
  getTripReadinessSummary,
} from '../src/utils/tripReadiness.js'

const makePlan = (overrides = {}) => ({
  id: 'arg-1',
  countryCode: 'ARG',
  countryName: 'Argentina',
  departureDate: '2026-10-21',
  returnDate: '2026-10-27',
  travelers: 3,
  budgetAmount: 100000,
  homeCurrency: 'UAH',
  tripStyles: ['Nature'],
  traveler: { fullName: 'Andrii', email: 'a@example.com', departureCity: 'Warsaw' },
  createdAt: '2026-09-22T00:00:00.000Z',
  updatedAt: '2026-09-22T00:00:00.000Z',
  ...overrides,
})

const setTripTask = (state, planId, taskId, checked = true) => tripPlansReducer(state, setTripReadinessTask({
  planId,
  taskId,
  checked,
}))

const setTravelerTask = (state, planId, travelerId, taskId, checked = true) => tripPlansReducer(state, setTravelerReadinessTask({
  planId,
  travelerId,
  taskId,
  checked,
}))

const completeTasksByLevel = (state, planId, level) => {
  const plan = state.plans.find((item) => item.id === planId)
  TRIP_READINESS_TASKS.filter((task) => task.level === level).forEach((task) => {
    state = setTripTask(state, planId, task.id)
  })
  plan.readiness.travelers.forEach((traveler) => {
    TRAVELER_READINESS_TASKS.filter((task) => task.level === level).forEach((task) => {
      state = setTravelerTask(state, planId, traveler.id, task.id)
    })
  })
  return state
}

test('old HW10 trip without readiness is migrated lazily', () => {
  const normalized = normalizeTripPlan(makePlan({ travelers: 1, readiness: undefined }))
  const summary = getTripReadinessSummary(normalized)
  assert.equal(summary.status, 'not-started')
  assert.equal(summary.completed, 0)
  assert.equal(summary.total, 9)
  assert.equal(summary.readiness.travelers.length, 1)
})

test('untouched readiness starts without warnings', () => {
  const state = tripPlansReducer(undefined, saveTripPlan(makePlan()))
  const summary = getTripReadinessSummary(state.plans[0])
  assert.equal(summary.status, 'not-started')
  assert.equal(summary.completed, 0)
  assert.equal(summary.criticalIncomplete, 0)
  assert.equal(summary.missingTravelDocuments, 0)
  assert.equal(summary.total, 15)
})

test('first readiness action starts checklist and surfaces missing critical checks', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan()))
  state = setTripTask(state, 'arg-1', 'travelDates')
  const summary = getTripReadinessSummary(state.plans[0])
  assert.equal(summary.status, 'needs-attention')
  assert.equal(summary.completed, 1)
  assert.equal(summary.criticalIncomplete, 6)
  assert.equal(summary.missingTravelDocuments, 3)
  assert.equal(summary.missingEntryRequirements, 3)
})

test('traveler task updates affect only selected traveler', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan()))
  const firstTravelerId = state.plans[0].readiness.travelers[0].id
  state = setTravelerTask(state, 'arg-1', firstTravelerId, 'travelDocument')

  assert.equal(state.plans[0].readiness.travelers[0].tasks.travelDocument, true)
  assert.equal(state.plans[0].readiness.travelers[1].tasks.travelDocument, false)
})

test('all critical tasks but missing recommended tasks stays in progress', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({ travelers: 1 })))
  state = completeTasksByLevel(state, 'arg-1', 'critical')
  const summary = getTripReadinessSummary(state.plans[0])
  assert.equal(summary.criticalIncomplete, 0)
  assert.equal(summary.status, 'in-progress')
})

test('all critical and recommended tasks produce Ready even with optional tasks open', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({ travelers: 1 })))
  state = completeTasksByLevel(state, 'arg-1', 'critical')
  state = completeTasksByLevel(state, 'arg-1', 'recommended')
  const summary = getTripReadinessSummary(state.plans[0])
  assert.equal(summary.status, 'ready')
  assert.equal(summary.optionalIncomplete, 2)
  assert.equal(summary.completed, 7)
  assert.equal(summary.total, 9)
  assert.equal(summary.percent, 78)
})

test('all readiness tasks produce Complete and 100 percent', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({ travelers: 1 })))
  for (const level of ['critical', 'recommended', 'optional']) {
    state = completeTasksByLevel(state, 'arg-1', level)
  }
  const summary = getTripReadinessSummary(state.plans[0])
  assert.equal(summary.status, 'complete')
  assert.equal(summary.completed, 9)
  assert.equal(summary.total, 9)
  assert.equal(summary.percent, 100)
})

test('progress formula scales with traveler count', () => {
  for (const [travelers, total] of [[1, 9], [2, 12], [5, 21], [10, 36]]) {
    const state = tripPlansReducer(undefined, saveTripPlan(makePlan({ id: `arg-${travelers}`, travelers })))
    assert.equal(getTripReadinessSummary(state.plans[0]).total, total)
  }
})

test('same country trips keep independent readiness by trip id', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({ id: 'arg-1', travelers: 1 })))
  state = tripPlansReducer(state, saveTripPlan(makePlan({ id: 'arg-2', departureDate: '2026-12-10', returnDate: '2026-12-17', travelers: 1 })))
  state = setTripTask(state, 'arg-1', 'travelDates')

  const first = getTripReadinessSummary(state.plans.find((item) => item.id === 'arg-1'))
  const second = getTripReadinessSummary(state.plans.find((item) => item.id === 'arg-2'))
  assert.equal(first.status, 'needs-attention')
  assert.equal(second.status, 'not-started')
})

test('ordinary trip edit preserves readiness', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({ travelers: 1 })))
  const travelerId = state.plans[0].readiness.travelers[0].id
  state = setTravelerTask(state, 'arg-1', travelerId, 'insurance')
  state = tripPlansReducer(state, saveTripPlan(makePlan({ travelers: 1, budgetAmount: 120000, departureDate: '2026-10-22' })))

  assert.equal(state.plans[0].readiness.travelers[0].tasks.insurance, true)
  assert.equal(state.plans[0].departureDate, '2026-10-22')
})

test('increasing traveler count preserves existing travelers and adds clean slots', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({ travelers: 2 })))
  const firstTravelerId = state.plans[0].readiness.travelers[0].id
  state = setTravelerTask(state, 'arg-1', firstTravelerId, 'insurance')
  state = tripPlansReducer(state, saveTripPlan(makePlan({ travelers: 4, budgetAmount: 120000 })))

  assert.equal(state.plans[0].readiness.travelers.length, 4)
  assert.equal(state.plans[0].readiness.travelers[0].tasks.insurance, true)
  assert.equal(state.plans[0].readiness.travelers[3].tasks.insurance, false)
})

test('decreasing traveler count removes inactive slots from progress', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({ travelers: 3 })))
  state = tripPlansReducer(state, saveTripPlan(makePlan({ travelers: 2 })))
  const summary = getTripReadinessSummary(state.plans[0])
  assert.equal(summary.travelerCount, 2)
  assert.equal(summary.total, 12)
})

test('deleting a trip deletes its embedded readiness with it', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({ id: 'arg-1' })))
  state = tripPlansReducer(state, saveTripPlan(makePlan({ id: 'arg-2' })))
  state = tripPlansReducer(state, deleteTripPlan('arg-1'))
  assert.equal(state.plans.some((item) => item.id === 'arg-1'), false)
  assert.equal(state.plans.length, 1)
})


test('readiness uses saved traveler names and stable roster ids', () => {
  const plan = normalizeTripPlan(makePlan({
    travelers: 3,
    travelerRoster: [
      { id: 'andrii', fullName: 'Andrii Dolzhenko', email: 'a@example.com', departureCity: 'Warsaw' },
      { id: 'maria', fullName: 'Maria Dolzhenko', email: 'm@example.com' },
      { id: 'oleksandr', fullName: 'Олександр Петренко', email: '' },
    ],
  }))
  const summary = getTripReadinessSummary(plan)
  assert.deepEqual(summary.readiness.travelers.map((traveler) => traveler.id), ['andrii', 'maria', 'oleksandr'])
  assert.deepEqual(summary.readiness.travelers.map((traveler) => traveler.name), [
    'Andrii Dolzhenko',
    'Maria Dolzhenko',
    'Олександр Петренко',
  ])
})

test('renaming a traveler preserves readiness by stable traveler id', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({
    travelers: 2,
    travelerRoster: [
      { id: 'andrii', fullName: 'Andrii', email: 'a@example.com', departureCity: 'Warsaw' },
      { id: 'maria', fullName: 'Maria', email: 'm@example.com' },
    ],
  })))
  state = setTravelerTask(state, 'arg-1', 'maria', 'insurance')
  state = tripPlansReducer(state, saveTripPlan(makePlan({
    travelers: 2,
    travelerRoster: [
      { id: 'andrii', fullName: 'Andrii Dolzhenko', email: 'a@example.com', departureCity: 'Warsaw' },
      { id: 'maria', fullName: 'Maria Dolzhenko', email: 'm@example.com' },
    ],
  })))

  const maria = state.plans[0].readiness.travelers.find((traveler) => traveler.id === 'maria')
  assert.equal(maria.name, 'Maria Dolzhenko')
  assert.equal(maria.tasks.insurance, true)
})

test('removing a specific middle traveler preserves readiness for the remaining stable ids', () => {
  let state = tripPlansReducer(undefined, saveTripPlan(makePlan({
    travelers: 4,
    travelerRoster: [
      { id: 'andrii', fullName: 'Andrii', email: 'a@example.com', departureCity: 'Warsaw' },
      { id: 'sia', fullName: 'Sia', email: 's@example.com' },
      { id: 'delta', fullName: 'Delta Godrem', email: 'd@example.com' },
      { id: 'sydney', fullName: 'Sydney', email: 'y@example.com' },
    ],
  })))
  state = setTravelerTask(state, 'arg-1', 'sydney', 'insurance')
  state = tripPlansReducer(state, saveTripPlan(makePlan({
    travelers: 3,
    travelerRoster: [
      { id: 'andrii', fullName: 'Andrii', email: 'a@example.com', departureCity: 'Warsaw' },
      { id: 'sia', fullName: 'Sia', email: 's@example.com' },
      { id: 'sydney', fullName: 'Sydney', email: 'y@example.com' },
    ],
  })))

  assert.deepEqual(state.plans[0].travelerRoster.map((traveler) => traveler.id), ['andrii', 'sia', 'sydney'])
  assert.equal(state.plans[0].readiness.travelers.some((traveler) => traveler.id === 'delta'), false)
  assert.equal(
    state.plans[0].readiness.travelers.find((traveler) => traveler.id === 'sydney').tasks.insurance,
    true,
  )
})
