const normalizeBoolean = (value) => value === true
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')

export const TRIP_READINESS_TASKS = Object.freeze([
  Object.freeze({ id: 'travelDates', label: 'Travel dates confirmed', helper: 'Review and confirm the travel window for this trip.', level: 'critical', icon: 'calendar' }),
  Object.freeze({ id: 'accommodation', label: 'Accommodation / stay details', helper: 'Confirm where you plan to stay.', level: 'recommended', icon: 'bed' }),
  Object.freeze({ id: 'budget', label: 'Budget & payment readiness', helper: 'Review your planned budget and payment options.', level: 'recommended', icon: 'budget' }),
  Object.freeze({ id: 'transportArrival', label: 'Transport / arrival plan', helper: 'Confirm how you will reach the destination and arrive.', level: 'recommended', icon: 'airplane' }),
  Object.freeze({ id: 'placesShortlisted', label: 'Places / itinerary shortlisted', helper: 'Save the places and experiences you want to visit.', level: 'optional', icon: 'places' }),
  Object.freeze({ id: 'packingReviewed', label: 'Packing list reviewed', helper: 'Review essential items before departure.', level: 'optional', icon: 'luggage' }),
])

export const TRAVELER_READINESS_TASKS = Object.freeze([
  Object.freeze({ id: 'travelDocument', label: 'Passport / travel document', helper: 'Confirm a valid travel document for this trip.', level: 'critical', icon: 'passport' }),
  Object.freeze({ id: 'entryRequirements', label: 'Entry requirements', helper: 'Review visa, ETA or accepted-ID requirements.', level: 'critical', icon: 'rules' }),
  Object.freeze({ id: 'insurance', label: 'Travel insurance', helper: 'Confirm suitable travel insurance for the traveler.', level: 'recommended', icon: 'shield' }),
])

export const READINESS_LEVEL_ORDER = Object.freeze(['critical', 'recommended', 'optional'])

export const READINESS_LEVEL_LABELS = Object.freeze({
  critical: 'Critical essentials',
  recommended: 'Recommended',
  optional: 'Optional',
})

const buildTaskState = (definitions, value) => Object.fromEntries(
  definitions.map(({ id }) => [id, normalizeBoolean(value?.[id])]),
)

const buildTraveler = (plan, index, existing) => {
  const rosterTraveler = Array.isArray(plan?.travelerRoster) ? plan.travelerRoster[index] : null
  return {
    id: normalizeText(rosterTraveler?.id) || normalizeText(existing?.id) || `${plan.id}-traveler-${index + 1}`,
    name: normalizeText(rosterTraveler?.fullName)
      || normalizeText(existing?.name)
      || (index === 0 ? normalizeText(plan.traveler?.fullName) || 'Primary traveler' : `Traveler ${index + 1}`),
    tasks: buildTaskState(TRAVELER_READINESS_TASKS, existing?.tasks),
  }
}

export const createTripReadiness = (plan) => ({
  started: false,
  tripTasks: buildTaskState(TRIP_READINESS_TASKS),
  travelers: Array.from({ length: Math.max(1, Number(plan?.travelers) || 1) }, (_, index) => buildTraveler(plan, index)),
})

export const normalizeTripReadiness = (value, plan) => {
  const existingTravelers = Array.isArray(value?.travelers) ? value.travelers : []
  const travelers = Array.from({ length: Math.max(1, Number(plan?.travelers) || 1) }, (_, index) => {
    const rosterId = normalizeText(plan?.travelerRoster?.[index]?.id)
    const existing = rosterId
      ? existingTravelers.find((traveler) => normalizeText(traveler?.id) === rosterId) || existingTravelers[index]
      : existingTravelers[index]
    return buildTraveler(plan, index, existing)
  })

  return {
    started: normalizeBoolean(value?.started),
    tripTasks: buildTaskState(TRIP_READINESS_TASKS, value?.tripTasks),
    travelers,
  }
}

const countCompleted = (taskState, definitions) => definitions.reduce(
  (total, { id }) => total + (taskState?.[id] === true ? 1 : 0),
  0,
)

const countIncompleteByLevel = (taskState, definitions, level) => definitions
  .filter((task) => task.level === level)
  .reduce((total, { id }) => total + (taskState?.[id] === true ? 0 : 1), 0)

export const getTripReadinessSummary = (plan) => {
  const readiness = normalizeTripReadiness(plan?.readiness, plan || {})
  const tripCompleted = countCompleted(readiness.tripTasks, TRIP_READINESS_TASKS)
  const travelerCompleted = readiness.travelers.reduce(
    (total, traveler) => total + countCompleted(traveler.tasks, TRAVELER_READINESS_TASKS),
    0,
  )
  const total = TRIP_READINESS_TASKS.length + (readiness.travelers.length * TRAVELER_READINESS_TASKS.length)
  const completed = readiness.started ? tripCompleted + travelerCompleted : 0
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  const tripCriticalIncomplete = countIncompleteByLevel(readiness.tripTasks, TRIP_READINESS_TASKS, 'critical')
  const travelerCriticalIncomplete = readiness.travelers.reduce(
    (total, traveler) => total + countIncompleteByLevel(traveler.tasks, TRAVELER_READINESS_TASKS, 'critical'),
    0,
  )
  const criticalIncomplete = tripCriticalIncomplete + travelerCriticalIncomplete

  const tripRecommendedIncomplete = countIncompleteByLevel(readiness.tripTasks, TRIP_READINESS_TASKS, 'recommended')
  const travelerRecommendedIncomplete = readiness.travelers.reduce(
    (total, traveler) => total + countIncompleteByLevel(traveler.tasks, TRAVELER_READINESS_TASKS, 'recommended'),
    0,
  )
  const recommendedIncomplete = tripRecommendedIncomplete + travelerRecommendedIncomplete

  const tripOptionalIncomplete = countIncompleteByLevel(readiness.tripTasks, TRIP_READINESS_TASKS, 'optional')
  const travelerOptionalIncomplete = readiness.travelers.reduce(
    (total, traveler) => total + countIncompleteByLevel(traveler.tasks, TRAVELER_READINESS_TASKS, 'optional'),
    0,
  )
  const optionalIncomplete = tripOptionalIncomplete + travelerOptionalIncomplete

  const missingTravelDocuments = readiness.travelers.filter((traveler) => !traveler.tasks.travelDocument).length
  const missingEntryRequirements = readiness.travelers.filter((traveler) => !traveler.tasks.entryRequirements).length
  const travelDatesMissing = readiness.tripTasks.travelDates !== true

  let status = 'not-started'
  if (readiness.started && completed === total) status = 'complete'
  else if (readiness.started && criticalIncomplete > 0) status = 'needs-attention'
  else if (readiness.started && recommendedIncomplete === 0) status = 'ready'
  else if (readiness.started) status = 'in-progress'

  return {
    readiness,
    total,
    completed,
    percent,
    criticalIncomplete: readiness.started ? criticalIncomplete : 0,
    recommendedIncomplete: readiness.started ? recommendedIncomplete : 0,
    optionalIncomplete: readiness.started ? optionalIncomplete : 0,
    missingTravelDocuments: readiness.started ? missingTravelDocuments : 0,
    missingEntryRequirements: readiness.started ? missingEntryRequirements : 0,
    travelDatesMissing: readiness.started ? travelDatesMissing : false,
    status,
    travelerCount: readiness.travelers.length,
  }
}

export const getReadinessStatusLabel = (status) => ({
  'not-started': 'Not started',
  'needs-attention': 'Needs attention',
  'in-progress': 'In progress',
  ready: 'Ready',
  complete: 'Complete',
}[status] || 'Not started')

export const getTravelerSummary = (traveler, started = true) => {
  const total = TRAVELER_READINESS_TASKS.length
  const completed = started ? countCompleted(traveler?.tasks, TRAVELER_READINESS_TASKS) : 0
  const criticalIncomplete = started
    ? TRAVELER_READINESS_TASKS.filter(({ id, level }) => level === 'critical' && !traveler?.tasks?.[id]).length
    : 0
  const recommendedIncomplete = started
    ? TRAVELER_READINESS_TASKS.filter(({ id, level }) => level === 'recommended' && !traveler?.tasks?.[id]).length
    : 0
  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
    criticalIncomplete,
    recommendedIncomplete,
    ready: started && criticalIncomplete === 0 && recommendedIncomplete === 0,
    complete: started && completed === total,
  }
}
