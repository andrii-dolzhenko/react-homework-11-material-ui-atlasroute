import { createSlice } from '@reduxjs/toolkit'

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const normalizeTripPlan = (value) => {
  if (!value || typeof value !== 'object') return null

  const id = normalizeText(value.id)
  const countryCode = normalizeText(value.countryCode).toUpperCase()
  const countryName = normalizeText(value.countryName)
  if (!id || !countryCode || !countryName) return null

  return {
    id,
    countryCode,
    countryName,
    countryFlagEmoji: normalizeText(value.countryFlagEmoji),
    countryFlagUrl: normalizeText(value.countryFlagUrl),
    countryHeroImage: normalizeText(value.countryHeroImage),
    departureDate: normalizeText(value.departureDate),
    returnDate: normalizeText(value.returnDate),
    travelers: Math.max(1, Math.round(normalizeNumber(value.travelers, 1))),
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
      fullName: normalizeText(value.traveler?.fullName),
      email: normalizeText(value.traveler?.email),
      phone: normalizeText(value.traveler?.phone),
      departureCity: normalizeText(value.traveler?.departureCity),
    },
    createdAt: normalizeText(value.createdAt) || new Date(0).toISOString(),
    updatedAt: normalizeText(value.updatedAt) || normalizeText(value.createdAt) || new Date(0).toISOString(),
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

const tripPlansSlice = createSlice({
  name: 'tripPlans',
  initialState: DEFAULT_TRIP_PLANS_STATE,
  reducers: {
    saveTripPlan(state, action) {
      const plan = normalizeTripPlan(action.payload)
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
  },
})

export const { saveTripPlan, deleteTripPlan, clearTripPlans } = tripPlansSlice.actions

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
