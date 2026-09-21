import { configureStore } from '@reduxjs/toolkit'
import preferencesReducer from './preferencesSlice'
import countriesReducer from './countriesSlice'
import countryInsightsReducer from './countryInsightsSlice'
import recentlyViewedReducer from './recentlyViewedSlice'
import savedCountriesReducer from './savedCountriesSlice'
import tripPlansReducer from './tripPlansSlice'
import { loadPersistedState, savePersistedState } from './persistence'

export const store = configureStore({
  reducer: {
    countries: countriesReducer,
    countryInsights: countryInsightsReducer,
    preferences: preferencesReducer,
    savedCountries: savedCountriesReducer,
    tripPlans: tripPlansReducer,
    recentlyViewed: recentlyViewedReducer,
  },
  preloadedState: loadPersistedState(),
})

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    savePersistedState(store.getState())
  })
}
