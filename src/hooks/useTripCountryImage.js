import { useCallback, useMemo, useState } from 'react'
import useCountryMedia from './useCountryMedia.js'

const uniqueSources = (values) => [...new Set(values.filter(Boolean))]
const createImageState = (countryName) => ({
  countryName,
  failedSources: [],
  loadedSource: '',
  refreshAttempt: 0,
})

export default function useTripCountryImage(country, plan) {
  const countryName = country?.name || plan?.countryName || ''
  const stableHero = country?.heroImage || ''
  const savedHero = plan?.countryHeroImage || ''
  const [storedState, setStoredState] = useState(() => createImageState(countryName))
  const imageState = storedState.countryName === countryName
    ? storedState
    : createImageState(countryName)
  const { failedSources, loadedSource, refreshAttempt } = imageState

  const updateImageState = useCallback((update) => {
    setStoredState((current) => {
      const active = current.countryName === countryName
        ? current
        : createImageState(countryName)
      return update(active)
    })
  }, [countryName])

  const shouldFetchMedia = Boolean(countryName && ((!savedHero && !stableHero) || refreshAttempt > 0))
  const { images, loading, error } = useCountryMedia(countryName, {
    enabled: shouldFetchMedia,
    limit: 3,
    forceRefresh: refreshAttempt || false,
  })

  const candidates = useMemo(() => uniqueSources([
    savedHero,
    stableHero,
    ...images.flatMap((item) => [item?.src, item?.preview]),
  ]), [images, savedHero, stableHero])

  const image = candidates.find((source) => !failedSources.includes(source)) || ''
  const loaded = Boolean(image && loadedSource === image)

  const handleLoad = useCallback(() => {
    if (!image) return
    updateImageState((current) => ({ ...current, loadedSource: image }))
  }, [image, updateImageState])

  const imageRef = useCallback((node) => {
    if (!node || !image) return
    if (node.complete && node.naturalWidth > 0) {
      updateImageState((current) => ({ ...current, loadedSource: image }))
    }
  }, [image, updateImageState])

  const handleError = useCallback(() => {
    if (!image) return
    updateImageState((current) => ({
      ...current,
      failedSources: current.failedSources.includes(image)
        ? current.failedSources
        : [...current.failedSources, image],
      loadedSource: '',
      refreshAttempt: current.refreshAttempt < 1 ? current.refreshAttempt + 1 : current.refreshAttempt,
    }))
  }, [image, updateImageState])

  return {
    image,
    loaded,
    loading: Boolean(image && !loaded) || loading,
    error,
    handleLoad,
    handleError,
    imageRef,
  }
}
