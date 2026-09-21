import Lottie from 'lottie-react'
import travelIcons from '../../assets/travel-icons.json'

const iconCenters = {
  mountain: [174, 158],
  passport: [403.333, 158],
  world: [632.667, 158],
  compass: [174, 396],
  van: [403.333, 396],
  camera: [632.667, 396],
  airplane: [174, 648],
  baggage: [403.333, 648],
  map: [632.667, 648],
}

export default function TravelAnimatedIcon({ name, size = 52, className = '' }) {
  const [sourceX, sourceY] = iconCenters[name] || iconCenters.compass
  const scale = size / 250
  const canvasSize = 800 * scale
  const translateX = (size / 2) - (sourceX * scale)
  const translateY = (size / 2) - (sourceY * scale)

  return (
    <span
      className={`travel-animated-icon${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="travel-animated-icon__canvas"
        style={{
          width: canvasSize,
          height: canvasSize,
          transform: `translate(${translateX}px, ${translateY}px)`,
        }}
      >
        <Lottie animationData={travelIcons} autoplay loop={false} />
      </span>
    </span>
  )
}
