import { useEffect, useRef, useState } from 'react'
import Lottie from 'lottie-react'
import passportAnimation from '../../assets/trip-passport-planning.json'
import passportAnimationDark from '../../assets/trip-passport-planning-dark.json'

let passportAnimatedSinceLoad = false

const readReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

const stopAtLastFrame = (instance) => {
  const frames = instance?.getDuration?.(true)
  if (Number.isFinite(frames) && frames > 0) {
    instance.goToAndStop(Math.max(0, frames - 1), true)
  }
}

export default function TripPassportAnimation() {
  const rootRef = useRef(null)
  const lightRef = useRef(null)
  const darkRef = useRef(null)
  const readyRef = useRef({ light: false, dark: false })
  const startedRef = useRef(false)
  const [readyVersion, setReadyVersion] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion)
  const [inViewport, setInViewport] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setReducedMotion(query.matches)
    query.addEventListener?.('change', handleChange)
    return () => query.removeEventListener?.('change', handleChange)
  }, [])

  useEffect(() => {
    const element = rootRef.current
    if (!element) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setInViewport(true)
      observer.disconnect()
    }, { threshold: 0.15 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const instances = [lightRef.current, darkRef.current].filter(Boolean)
    instances.forEach((instance) => instance.setSpeed?.(0.62))

    if (!readyRef.current.light || !readyRef.current.dark) return

    if (passportAnimatedSinceLoad || reducedMotion) {
      instances.forEach(stopAtLastFrame)
      return
    }

    if (!inViewport) {
      // Use the finished illustration as a poster frame so cold reloads never
      // reveal a blank Lottie canvas while the IntersectionObserver settles.
      instances.forEach(stopAtLastFrame)
      return
    }

    if (startedRef.current) return
    startedRef.current = true
    instances.forEach((instance) => instance.goToAndPlay?.(0, true))
  }, [inViewport, readyVersion, reducedMotion])

  const handleReady = (variant, instance) => {
    readyRef.current[variant] = true
    instance?.setSpeed?.(0.62)
    stopAtLastFrame(instance)
    setReadyVersion((value) => value + 1)
  }

  const handleComplete = () => {
    passportAnimatedSinceLoad = true
    stopAtLastFrame(lightRef.current)
    stopAtLastFrame(darkRef.current)
  }

  return (
    <span ref={rootRef} className="trip-passport-animation" aria-hidden="true">
      <span className="trip-passport-animation__variant trip-passport-animation__variant--light">
        <Lottie
          lottieRef={lightRef}
          animationData={passportAnimation}
          autoplay={false}
          loop={false}
          onDOMLoaded={() => handleReady('light', lightRef.current)}
          onComplete={handleComplete}
        />
      </span>
      <span className="trip-passport-animation__variant trip-passport-animation__variant--dark">
        <Lottie
          lottieRef={darkRef}
          animationData={passportAnimationDark}
          autoplay={false}
          loop={false}
          onDOMLoaded={() => handleReady('dark', darkRef.current)}
          onComplete={handleComplete}
        />
      </span>
    </span>
  )
}
