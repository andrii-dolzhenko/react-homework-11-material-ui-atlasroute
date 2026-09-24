import { Checkbox, Stack, Typography } from '@mui/material'
import ReadinessIcon from './ReadinessIcon.jsx'

export default function ReadinessTaskRow({ task, checked, onChange, disabled = false }) {
  return (
    <Stack className="readiness-task-row" direction="row" alignItems="center" spacing={1.35}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        inputProps={{ 'aria-label': task.label }}
        size="small"
      />
      <ReadinessIcon name={task.icon} tone={task.level} />
      <span className="readiness-task-row__copy">
        <Typography component="strong">{task.label}</Typography>
        <Typography component="small">{task.helper}</Typography>
      </span>
    </Stack>
  )
}
