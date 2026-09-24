import { createSlice } from '@reduxjs/toolkit'
import { createTripReadiness, normalizeTripReadiness } from '../utils/tripReadiness.js'

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}


const normalizeTraveler = (value, index, planId, fallbackPrimary = {}) => ({
  id: normalizeText(value?.id) || `${planId}-traveler-${index + 1}`,
  role: index === 0 ? 'primary' : 'companion',
  fullName: normalizeText(value?.fullName) || (index === 0 ? normalizeText(fallbackPrimary.fullName) : ''),
  email: normalizeText(value?.email) || (index === 0 ? normalizeText(fallbackPrimary.email) : ''),
  phone: index === 0 ? normalizeText(value?.phone) || normalizeText(fallbackPrimary.phone) : '',
  departureCity: index === 0 ? normalizeText(value?.departureCity) || normalizeText(fallbackPrimary.departureCity) : '',
})

const normalizeTravelerRoster = (value, count, planId, fallbackPrimary) => {
  const source = Array.isArray(value) ? value : []
  return Array.from({ length: count }, (_, index) => normalizeTraveler(source[index], index, planId, fallbackPrimary))
}

export const normalizeTripPlan = (value) => {
  if (!value || typeof value !== 'object') return null

  const id = normalizeText(value.id)
  const countryCode = normalizeText(value.countryCode).toUpperCase()
  const countryName = normalizeText(value.countryName)
  if (!id || !countryCode || !countryName) return null

  const travelerCount = Math.min(10, Math.max(1, Math.round(normalizeNumber(value.travelers, 1))))
  const legacyTraveler = {
    fullName: normalizeText(value.traveler?.fullName),
    email: normalizeText(value.traveler?.email),
    phone: normalizeText(value.traveler?.phone),
    departureCity: normalizeText(value.traveler?.departureCity),
  }
  const travelerRoster = normalizeTravelerRoster(value.travelerRoster, travelerCount, id, legacyTraveler)

  const plan = {
    id,
    countryCode,
    countryName,
    countryFlagEmoji: normalizeText(value.countryFlagEmoji),
    countryFlagUrl: normalizeText(value.countryFlagUrl),
    countryHeroImage: normalizeText(value.countryHeroImage),
    departureDate: normalizeText(value.departureDate),
    returnDate: normalizeText(value.returnDate),
    travelers: travelerRoster.length,
    budgetAmount: Math.max(0, normalizeNumber(value.budgetAmount)),
    homeCurrency: normalizeText(value.homeCurrency).toUpperCase() || 'UAH',
    destinationCurrency: normalizeText(value.destinationCurrency).toUpperCase(),
    exchangeRate: normalizeNumber(value.exchangeRate, 0),
    estimatedDestinationBudget: Math.max(0, normalizeNumber(value.estimatedDestinationBudget)),
    tripStyles: Array.isArray(value.tripStyles)
      ? [...new Set(value.tripStyles.map(normalizeText).filter(Boolean))]
      : [],
    preferredRegions: normalizeText(value.preferredRegions),
    notes: normalizeText(value.notes),
    traveler: {
      fullName: travelerRoster[0].fullName,
      email: travelerRoster[0].email,
      phone: travelerRoster[0].phone,
      departureCity: travelerRoster[0].departureCity,
    },
    travelerRoster,
    createdAt: normalizeText(value.createdAt) || new Date(0).toISOString(),
    updatedAt: normalizeText(value.updatedAt) || normalizeText(value.createdAt) || new Date(0).toISOString(),
  }

  return {
    ...plan,
    readiness: normalizeTripReadiness(value.readiness, plan),
  }
}

export const normalizeTripPlans = (value) => {
  if (!Array.isArray(value)) return []

  const plans = value.map(normalizeTripPlan).filter(Boolean)
  const byId = new Map()
  plans.forEach((plan) => byId.set(plan.id, plan))

  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export const DEFAULT_TRIP_PLANS_STATE = Object.freeze({
  plans: Object.freeze([]),
})

const findPlan = (state, id) => state.plans.find((plan) => plan.id === normalizeText(id))

const prepareReadiness = (plan) => {
  plan.readiness = normalizeTripReadiness(plan.readiness, plan)
  plan.readiness.started = true
  plan.updatedAt = new Date().toISOString()
  return plan.readiness
}

const tripPlansSlice = createSlice({
  name: 'tripPlans',
  initialState: DEFAULT_TRIP_PLANS_STATE,
  reducers: {
    saveTripPlan(state, action) {
      const raw = action.payload
      const existingId = normalizeText(raw?.id)
      const existing = existingId ? findPlan(state, existingId) : null
      const payload = existing && raw
        ? {
            ...raw,
            readiness: raw.readiness === undefined ? existing.readiness : raw.readiness,
            travelerRoster: raw.travelerRoster === undefined ? existing.travelerRoster : raw.travelerRoster,
          }
        : raw
      const plan = normalizeTripPlan(payload)
      if (!plan) return

      const existingIndex = state.plans.findIndex((item) => item.id === plan.id)
      if (existingIndex >= 0) state.plans.splice(existingIndex, 1)
      state.plans.unshift(plan)
    },
    deleteTripPlan(state, action) {
      const id = normalizeText(action.payload)
      state.plans = state.plans.filter((plan) => plan.id !== id)
    },
    clearTripPlans(state) {
      state.plans = []
    },
    setTripReadinessTask(state, action) {
      const { planId, taskId, checked } = action.payload || {}
      const plan = findPlan(state, planId)
      if (!plan || !(taskId in plan.readiness.tripTasks)) return
      const readiness = prepareReadiness(plan)
      readiness.tripTasks[taskId] = checked === true
    },
    setTravelerReadinessTask(state, action) {
      const { planId, travelerId, taskId, checked } = action.payload || {}
      const plan = findPlan(state, planId)
      if (!plan) return
      const readiness = prepareReadiness(plan)
      const traveler = readiness.travelers.find((item) => item.id === travelerId)
      if (!traveler || !(taskId in traveler.tasks)) return
      traveler.tasks[taskId] = checked === true
    },
    resetTripReadiness(state, action) {
      const plan = findPlan(state, action.payload)
      if (!plan) return
      plan.readiness = createTripReadiness(plan)
      plan.updatedAt = new Date().toISOString()
    },
  },
})

export const {
  saveTripPlan,
  deleteTripPlan,
  clearTripPlans,
  setTripReadinessTask,
  setTravelerReadinessTask,
  resetTripReadiness,
} = tripPlansSlice.actions

export const selectTripPlans = (state) => state.tripPlans.plans
export const selectTripPlanCount = (state) => state.tripPlans.plans.length
export const selectTripPlansByCountry = (state, countryCode) => {
  const code = normalizeText(countryCode).toUpperCase()
  if (!code) return []
  return state.tripPlans.plans.filter((plan) => plan.countryCode === code)
}
export const selectTripPlanById = (state, id) => (
  state.tripPlans.plans.find((plan) => plan.id === id) ?? null
)

export default tripPlansSlice.reducer
