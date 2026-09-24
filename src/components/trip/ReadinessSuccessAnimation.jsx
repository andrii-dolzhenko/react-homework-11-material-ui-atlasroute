import { useEffect, useMemo, useRef, useState } from 'react'
import Lottie from 'lottie-react'
import { useTheme } from '@mui/material/styles'
import successAnimation from '../../assets/readiness-complete.json'

const paletteByMode = {
  light: {
    ink: [0.043, 0.165, 0.212, 1],
    blue: [0.333, 0.725, 0.91, 1],
    sky: [0.388, 0.784, 0.937, 1],
    accent: [0.941, 0.745, 0.494, 1],
  },
  dark: {
    ink: [0.77, 0.91, 0.97, 1],
    blue: [0.333, 0.725, 0.91, 1],
    sky: [0.278, 0.82, 0.91, 1],
    accent: [0.941, 0.745, 0.494, 1],
  },
}

const distance = (a, b) => a.slice(0, 3).reduce((total, value, index) => total + Math.abs(value - b[index]), 0)

const recolorAnimation = (source, mode) => {
  const copy = JSON.parse(JSON.stringify(source))
  const palette = paletteByMode[mode] || paletteByMode.light
  const sourceColors = {
    ink: [0.161, 0.243, 0.325, 1],
    sky: [0.404, 0.635, 0.788, 1],
    accentA: [1, 0.612, 0.443, 1],
    accentB: [0.988, 0.471, 0.176, 1],
    blue: [0.063, 0.388, 0.776, 1],
  }

  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!value || typeof value !== 'object') return

    if ((value.ty === 'fl' || value.ty === 'st') && Array.isArray(value.c?.k) && value.c.k.length === 4) {
      const color = value.c.k
      if (distance(color, sourceColors.ink) < 0.08) value.c.k = palette.ink
      else if (distance(color, sourceColors.sky) < 0.08) value.c.k = palette.sky
      else if (distance(color, sourceColors.blue) < 0.08) value.c.k = palette.blue
      else if (distance(color, sourceColors.accentA) < 0.12 || distance(color, sourceColors.accentB) < 0.12) value.c.k = palette.accent
    }

    Object.values(value).forEach(visit)
  }

  visit(copy)
  return copy
}

const getReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

const SUCCESS_HOLD_FRAME = 330

const stopOnHoldFrame = (instance) => {
  const frames = instance?.getDuration?.(true)
  if (!Number.isFinite(frames)) return
  const holdFrame = Math.min(SUCCESS_HOLD_FRAME, Math.max(0, frames - 1))
  instance?.goToAndStop?.(holdFrame, true)
}

const playToHoldFrame = (instance) => {
  const frames = instance?.getDuration?.(true)
  if (!Number.isFinite(frames)) return
  const holdFrame = Math.min(SUCCESS_HOLD_FRAME, Math.max(0, frames - 1))
  instance?.playSegments?.([0, holdFrame], true)
}

export default function ReadinessSuccessAnimation({
  size = 120,
  playKey = 0,
  play = true,
  className = '',
}) {
  const theme = useTheme()
  const lottieRef = useRef(null)
  const [reducedMotion, setReducedMotion] = useState(getReducedMotion)
  const animationData = useMemo(() => recolorAnimation(successAnimation, theme.palette.mode), [theme.palette.mode])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(query.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    const instance = lottieRef.current
    if (!instance) return
    if (reducedMotion || !play) {
      stopOnHoldFrame(instance)
      return
    }
    playToHoldFrame(instance)
  }, [animationData, play, playKey, reducedMotion])

  return (
    <span className={`readiness-success-animation${className ? ` ${className}` : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={false}
        loop={false}
        onComplete={() => stopOnHoldFrame(lottieRef.current)}
        onDOMLoaded={() => {
          if (reducedMotion || !play) stopOnHoldFrame(lottieRef.current)
          else playToHoldFrame(lottieRef.current)
        }}
      />
    </span>
  )
}
