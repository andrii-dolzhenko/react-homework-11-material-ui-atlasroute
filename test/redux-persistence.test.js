import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LEGACY_PREFERENCES_STORAGE_KEY,
  REDUX_STORAGE_KEY,
  loadPersistedState,
  normalizePersistedState,
  savePersistedState,
} from '../src/redux/persistence.js'

const originalWindow = globalThis.window

const createLocalStorage = () => {
  const values = new Map()

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
    clear() {
      values.clear()
    },
  }
}

const installWindow = () => {
  globalThis.window = { localStorage: createLocalStorage() }
}

const restoreWindow = () => {
  if (originalWindow === undefined) {
    delete globalThis.window
  } else {
    globalThis.window = originalWindow
  }
}

test('persisted Redux state is validated and normalized', () => {
  const normalized = normalizePersistedState({
    preferences: { theme: 'dark', unitSystem: 'imperial' },
    savedCountries: { savedCountryCodes: [' isl ', 'JPN', 'isl'] },
    recentlyViewed: {
      countries: [
        { code: 'jpn', name: ' Japan ', region: 'Asia' },
        { code: 'JPN', name: 'Duplicate', region: 'Asia' },
      ],
    },
    tripPlans: {
      plans: [{
        id: 'aus-1',
        countryCode: 'aus',
        countryName: 'Australia',
        departureDate: '2026-10-01',
        returnDate: '2026-10-10',
        travelers: 2,
        budgetAmount: 50000,
        homeCurrency: 'uah',
        destinationCurrency: 'aud',
        tripStyles: ['Nature', 'Nature'],
        traveler: { fullName: ' Andrii ', email: 'a@example.com', departureCity: ' Kyiv ' },
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-18T00:00:00.000Z',
      }],
    },
  })

  assert.deepEqual(normalized.preferences, { theme: 'dark', unitSystem: 'imperial' })
  assert.deepEqual(normalized.savedCountries.savedCountryCodes, ['ISL', 'JPN'])
  assert.deepEqual(normalized.recentlyViewed.countries.map(({ code }) => code), ['JPN'])
  assert.equal(normalized.tripPlans.plans[0].countryCode, 'AUS')
  assert.equal(normalized.tripPlans.plans[0].homeCurrency, 'UAH')
  assert.deepEqual(normalized.tripPlans.plans[0].tripStyles, ['Nature'])
})

test('invalid persisted values fall back without losing valid data', () => {
  const normalized = normalizePersistedState({
    preferences: { theme: 'neon', unitSystem: 'yards' },
    savedCountries: { savedCountryCodes: ['che'] },
  })

  assert.deepEqual(normalized.preferences, { theme: 'light', unitSystem: 'metric' })
  assert.deepEqual(normalized.savedCountries.savedCountryCodes, ['CHE'])
  assert.deepEqual(normalized.recentlyViewed.countries, [])
  assert.deepEqual(normalized.tripPlans.plans, [])
})

test('loadPersistedState returns undefined outside the browser', () => {
  delete globalThis.window
  assert.equal(loadPersistedState(), undefined)
  restoreWindow()
})

test('legacy preferences migrate into the Redux store shape', () => {
  installWindow()
  window.localStorage.setItem(LEGACY_PREFERENCES_STORAGE_KEY, JSON.stringify({
    theme: 'dark',
    unitSystem: 'imperial',
    savedCountryCodes: ['jpn', 'isl'],
  }))

  assert.deepEqual(loadPersistedState(), {
    preferences: { theme: 'dark', unitSystem: 'imperial' },
    savedCountries: { savedCountryCodes: ['JPN', 'ISL'] },
    recentlyViewed: { countries: [] },
    tripPlans: { plans: [] },
  })

  restoreWindow()
})

test('savePersistedState stores only normalized Redux data', () => {
  installWindow()

  assert.equal(savePersistedState({
    preferences: { theme: 'dark', unitSystem: 'imperial' },
    savedCountries: { savedCountryCodes: [' jpn ', 'JPN'] },
    recentlyViewed: {
      countries: [{ code: 'che', name: 'Switzerland', region: 'Europe' }],
    },
    tripPlans: {
      plans: [{
        id: 'che-1',
        countryCode: 'che',
        countryName: 'Switzerland',
        departureDate: '2026-10-01',
        returnDate: '2026-10-05',
        travelers: 1,
        budgetAmount: 1000,
        homeCurrency: 'eur',
        traveler: { fullName: 'A', email: 'a@example.com', departureCity: 'Kyiv' },
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-18T00:00:00.000Z',
      }],
    },
  }), true)

  const stored = JSON.parse(window.localStorage.getItem(REDUX_STORAGE_KEY))
  assert.deepEqual(stored.savedCountries.savedCountryCodes, ['JPN'])
  assert.deepEqual(stored.recentlyViewed.countries[0].code, 'CHE')
  assert.equal(stored.tripPlans.plans[0].countryCode, 'CHE')

  restoreWindow()
})
