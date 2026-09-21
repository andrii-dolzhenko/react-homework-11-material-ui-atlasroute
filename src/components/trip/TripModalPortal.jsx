import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function TripModalPortal({ children, onClose }) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
