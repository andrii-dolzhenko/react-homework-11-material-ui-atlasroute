import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useDispatch } from 'react-redux'
import { formatTripDate } from '../../utils/tripPlan.js'
import {
  READINESS_LEVEL_LABELS,
  READINESS_LEVEL_ORDER,
  TRAVELER_READINESS_TASKS,
  TRIP_READINESS_TASKS,
  getReadinessStatusLabel,
  getTripReadinessSummary,
} from '../../utils/tripReadiness.js'
import {
  resetTripReadiness,
  setTravelerReadinessTask,
  setTripReadinessTask,
} from '../../redux/tripPlansSlice.js'
import ReadinessTaskRow from './ReadinessTaskRow.jsx'
import ReadinessSuccessAnimation from './ReadinessSuccessAnimation.jsx'
import TravelerReadinessMatrix from './TravelerReadinessMatrix.jsx'
import TripUiIcon from './TripUiIcon.jsx'

const getCriticalMessage = (summary) => {
  const { missingTravelDocuments, missingEntryRequirements, travelDatesMissing, travelerCount } = summary
  const issueTypes = [missingTravelDocuments > 0, missingEntryRequirements > 0, travelDatesMissing].filter(Boolean).length

  if (issueTypes > 1) {
    return {
      title: 'Critical readiness checks need attention.',
      body: `${summary.criticalIncomplete} critical ${summary.criticalIncomplete === 1 ? 'check is' : 'checks are'} still unconfirmed.`,
    }
  }

  if (missingTravelDocuments > 0) {
    return {
      title: travelerCount === 1 ? 'Travel document not confirmed.' : 'Travel documents need attention.',
      body: travelerCount === 1
        ? 'Check your passport or accepted travel document before departure.'
        : `${missingTravelDocuments} of ${travelerCount} travelers still need to confirm their travel documents.`,
    }
  }

  if (missingEntryRequirements > 0) {
    return {
      title: 'Entry requirements need confirmation.',
      body: travelerCount === 1
        ? 'Review the entry requirements that apply to this traveler.'
        : `${missingEntryRequirements} of ${travelerCount} travelers still need to confirm entry requirements.`,
    }
  }

  return {
    title: 'Travel dates not confirmed.',
    body: 'Review and confirm the travel window for this trip.',
  }
}

export default function TripReadinessModal({ plan, open, onClose, playKey = 0 }) {
  const dispatch = useDispatch()
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('sm'))

  if (!plan) return null

  const summary = getTripReadinessSummary(plan)
  const readiness = summary.readiness
  const singleTraveler = summary.travelerCount === 1
  const criticalMessage = summary.criticalIncomplete > 0 ? getCriticalMessage(summary) : null

  const setTripTask = (taskId, checked) => {
    dispatch(setTripReadinessTask({ planId: plan.id, taskId, checked }))
  }

  const setTravelerTask = (travelerId, taskId, checked) => {
    dispatch(setTravelerReadinessTask({ planId: plan.id, travelerId, taskId, checked }))
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={compact}
      aria-labelledby="trip-readiness-dialog-title"
      PaperProps={{ className: 'readiness-modal' }}
    >
      <DialogContent className="readiness-modal__content">
        <IconButton className="readiness-modal__close" onClick={onClose} aria-label="Close trip readiness">
          <TripUiIcon name="close" size={18} />
        </IconButton>

        <div className={`readiness-modal__hero${summary.status === 'complete' ? ' readiness-modal__hero--complete' : ''}`}>
          {summary.status === 'complete' && (
            <ReadinessSuccessAnimation
              size={compact ? 104 : 132}
              playKey={`${plan.id}-${playKey}`}
              play={open}
            />
          )}
          <span>
            <Typography className="readiness-card__eyebrow" component="p">Trip readiness</Typography>
            <Typography id="trip-readiness-dialog-title" component="h2">
              {summary.status === 'complete' ? 'All set for your trip!' : plan.countryName}
            </Typography>
            <Typography component="p">
              {formatTripDate(plan.departureDate, { includeYear: false })} – {formatTripDate(plan.returnDate)} · {summary.travelerCount} {summary.travelerCount === 1 ? 'traveler' : 'travelers'}
            </Typography>
            {summary.status === 'complete' && (
              <Typography component="p" className="readiness-modal__success-copy">
                You’ve completed all readiness checks. You’re fully prepared for {plan.countryName}.
              </Typography>
            )}
          </span>
        </div>

        <div className="readiness-modal__progress">
          <div>
            <strong>{summary.status === 'not-started' ? 'Checklist not started' : `${summary.completed}/${summary.total} completed`}</strong>
            <span>{summary.status === 'not-started' ? getReadinessStatusLabel(summary.status) : `${summary.percent}% · ${getReadinessStatusLabel(summary.status)}`}</span>
          </div>
          <LinearProgress variant="determinate" value={summary.percent} className={`readiness-progress readiness-progress--${summary.status === 'needs-attention' ? 'danger' : summary.status === 'not-started' ? 'neutral' : summary.status === 'in-progress' ? 'info' : 'success'}`} />
        </div>

        {summary.status === 'complete' && (
          <Alert severity="success" className="readiness-alert readiness-alert--success">
            <strong>Fully prepared.</strong>
            <span>All trip readiness checks are complete. Have a great trip!</span>
          </Alert>
        )}

        {summary.status === 'ready' && (
          <Alert severity="success" className="readiness-alert readiness-alert--success readiness-alert--ready">
            <strong>Essentials confirmed.</strong>
            <span>You’re ready for this trip. {summary.optionalIncomplete} optional {summary.optionalIncomplete === 1 ? 'step remains' : 'steps remain'}.</span>
          </Alert>
        )}

        {readiness.started && criticalMessage && (
          <Alert severity="warning" className="readiness-alert">
            <strong>{criticalMessage.title}</strong>
            <span>{criticalMessage.body}</span>
          </Alert>
        )}

        {singleTraveler ? (
          <div className="readiness-checklist readiness-checklist--modal">
            {READINESS_LEVEL_ORDER.map((level) => {
              const tripTasks = TRIP_READINESS_TASKS.filter((task) => task.level === level)
              const travelerTasks = TRAVELER_READINESS_TASKS.filter((task) => task.level === level)
              const traveler = readiness.travelers[0]
              return (
                <div className={`readiness-group readiness-group--${level}`} key={level}>
                  <div className="readiness-group__heading">
                    <span className="readiness-group__marker" />
                    <strong>{READINESS_LEVEL_LABELS[level]}</strong>
                  </div>
                  {travelerTasks.map((task) => (
                    <ReadinessTaskRow
                      key={`traveler-${task.id}`}
                      task={task}
                      checked={traveler.tasks[task.id]}
                      onChange={(checked) => setTravelerTask(traveler.id, task.id, checked)}
                    />
                  ))}
                  {tripTasks.map((task) => (
                    <ReadinessTaskRow
                      key={`trip-${task.id}`}
                      task={task}
                      checked={readiness.tripTasks[task.id]}
                      onChange={(checked) => setTripTask(task.id, checked)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ) : (
          <Stack spacing={2.2}>
            <Box className="readiness-modal__trip-tasks">
              <div className="readiness-group__heading">
                <span className="readiness-group__marker" />
                <strong>Trip-level tasks</strong>
                <small>{TRIP_READINESS_TASKS.length} checks · apply to the whole trip</small>
              </div>
              <div className="readiness-modal__trip-task-grid">
                {TRIP_READINESS_TASKS.map((task) => (
                  <ReadinessTaskRow
                    key={task.id}
                    task={task}
                    checked={readiness.tripTasks[task.id]}
                    onChange={(checked) => setTripTask(task.id, checked)}
                  />
                ))}
              </div>
            </Box>
            <Box className="readiness-modal__traveler-block">
              <div className="readiness-group__heading">
                <span className="readiness-group__marker" />
                <strong>Traveler readiness</strong>
                <small>{summary.travelerCount} travelers{summary.travelerCount > 5 ? ' · scroll if needed' : ''}</small>
              </div>
              <TravelerReadinessMatrix readiness={readiness} onToggle={setTravelerTask} />
            </Box>
          </Stack>
        )}

        <div className="readiness-modal__footer">
          <span>
            <span className="readiness-modal__footer-icon" aria-hidden="true">
              <TripUiIcon name="airplane" size={19} />
            </span>
            <small>{summary.status === 'complete' ? 'Prepared travelers travel further.' : 'This checklist is optional and stays editable.'}</small>
          </span>
          <Stack direction="row" spacing={1}>
            {readiness.started && summary.status !== 'complete' && (
              <Button color="inherit" onClick={() => dispatch(resetTripReadiness(plan.id))}>Reset</Button>
            )}
            <Button variant="contained" onClick={onClose}>Close</Button>
          </Stack>
        </div>
      </DialogContent>
    </Dialog>
  )
}
