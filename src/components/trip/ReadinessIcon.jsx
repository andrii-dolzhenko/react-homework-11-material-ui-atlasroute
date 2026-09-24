import { Box } from '@mui/material'
import TripUiIcon from './TripUiIcon.jsx'

export default function ReadinessIcon({ name, tone = 'default', size = 36 }) {
  return (
    <Box
      component="span"
      className={`readiness-icon readiness-icon--${tone}`}
      sx={{ width: size, height: size, minWidth: size }}
      aria-hidden="true"
    >
      <TripUiIcon name={name} size={Math.round(size * 0.52)} />
    </Box>
  )
}
