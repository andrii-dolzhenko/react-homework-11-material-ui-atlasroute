import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
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

const STATUS_TONE = {
  'not-started': 'neutral',
  'needs-attention': 'danger',
  'in-progress': 'info',
  ready: 'success',
  complete: 'success',
}

const tripLabel = (plan) => (
  `${formatTripDate(plan.departureDate, { includeYear: false })} – ${formatTripDate(plan.returnDate, { includeYear: false })}`
)

const getCriticalMessage = (summary) => {
  const { missingTravelDocuments, missingEntryRequirements, travelDatesMissing, travelerCount } = summary
  const issueTypes = [missingTravelDocuments > 0, missingEntryRequirements > 0, travelDatesMissing].filter(Boolean).length

  if (issueTypes > 1) {
    return {
      title: 'Critical readiness checks need attention.',
      body: `${summary.criticalIncomplete} critical ${summary.criticalIncomplete === 1 ? 'check is' : 'checks are'} still unconfirmed for this trip.`,
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

export default function TripReadinessPanel({ country, tripPlans = [] }) {
  const dispatch = useDispatch()
  const [expanded, setExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState(tripPlans[0]?.id || '')
  const [successPlayKey, setSuccessPlayKey] = useState(0)
  const [playSuccess, setPlaySuccess] = useState(false)
  const playedCompleteTrips = useRef(new Set())

  useEffect(() => {
    if (!tripPlans.length) {
      setSelectedId('')
      setExpanded(false)
      return
    }
    if (!tripPlans.some((plan) => plan.id === selectedId)) setSelectedId(tripPlans[0].id)
  }, [selectedId, tripPlans])

  const selectedPlan = useMemo(
    () => tripPlans.find((plan) => plan.id === selectedId) || tripPlans[0] || null,
    [selectedId, tripPlans],
  )
  const summary = selectedPlan ? getTripReadinessSummary(selectedPlan) : null
  const readiness = summary?.readiness
  const singleTraveler = summary?.travelerCount === 1
  const criticalMessage = summary?.criticalIncomplete > 0 ? getCriticalMessage(summary) : null

  useEffect(() => {
    if (!expanded || !selectedPlan || summary?.status !== 'complete') {
      setPlaySuccess(false)
      return
    }

    if (playedCompleteTrips.current.has(selectedPlan.id)) {
      setPlaySuccess(false)
      return
    }

    playedCompleteTrips.current.add(selectedPlan.id)
    setSuccessPlayKey((value) => value + 1)
    setPlaySuccess(true)
  }, [expanded, selectedPlan, summary?.status])

  const setTripTask = (taskId, checked) => {
    if (!selectedPlan) return
    dispatch(setTripReadinessTask({ planId: selectedPlan.id, taskId, checked }))
  }

  const setTravelerTask = (travelerId, taskId, checked) => {
    if (!selectedPlan) return
    dispatch(setTravelerReadinessTask({ planId: selectedPlan.id, travelerId, taskId, checked }))
  }

  return (
    <section className="shell readiness-section" aria-labelledby={`readiness-title-${country.code}`}>
      <Box className={`readiness-card${expanded ? ' readiness-card--expanded' : ''}`}>
        <span className="readiness-card__route-art" aria-hidden="true" />

        <div className="readiness-card__header">
          <div className="readiness-card__heading-copy">
            <Typography className="readiness-card__eyebrow" component="p">Trip readiness</Typography>
            <Typography id={`readiness-title-${country.code}`} component="h2">Get ready for your {country.name} trip{tripPlans.length > 1 ? 's' : ''}</Typography>
            <Typography component="p" className="readiness-card__subtitle">
              {tripPlans.length
                ? 'Track practical travel checks for each saved trip.'
                : 'Save a trip plan to start a practical readiness checklist.'}
            </Typography>
          </div>

          {selectedPlan && (
            <Button
              className="readiness-disclosure"
              disableRipple
              disableFocusRipple
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Hide trip readiness details' : 'Show trip readiness details'}
            >
              <span className="readiness-disclosure__label">{expanded ? 'Hide details' : 'Show details'}</span>
              <span className={`readiness-disclosure__chevron${expanded ? ' readiness-disclosure__chevron--up' : ''}`} aria-hidden="true">
                <TripUiIcon name="chevronDown" size={18} />
              </span>
            </Button>
          )}
        </div>

        {!selectedPlan ? (
          <div className="readiness-empty-note">
            <span>
              <strong>Readiness starts with a saved trip.</strong>
              <small>Create a trip below, then return here to track documents, insurance and other essentials.</small>
            </span>
          </div>
        ) : (
          <>
            {tripPlans.length > 1 ? (
              <div className="readiness-trip-switcher" aria-label={`${country.name} saved trips`}>
                {tripPlans.map((plan) => {
                  const planSummary = getTripReadinessSummary(plan)
                  return (
                    <button
                      className={`readiness-trip-pill readiness-trip-pill--${STATUS_TONE[planSummary.status]}${plan.id === selectedPlan.id ? ' readiness-trip-pill--active' : ''}`}
                      type="button"
                      key={plan.id}
                      onClick={() => setSelectedId(plan.id)}
                      aria-pressed={plan.id === selectedPlan.id}
                    >
                      <span className="readiness-trip-pill__dot" aria-hidden="true" />
                      <span>
                        <strong>{tripLabel(plan)}</strong>
                        <small>{planSummary.status === 'not-started' ? 'Not started' : `${planSummary.completed}/${planSummary.total} completed`}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="readiness-single-trip-meta">
                <span>{tripLabel(selectedPlan)}</span>
                <span>{summary.travelerCount} {summary.travelerCount === 1 ? 'traveler' : 'travelers'}</span>
              </div>
            )}

            <div className="readiness-summary-row">
              <div className="readiness-summary-row__meta">
                <strong>{summary.status === 'not-started' ? 'Checklist not started' : `${summary.completed}/${summary.total} completed`}</strong>
                <Chip
                  size="small"
                  className={`readiness-status readiness-status--${STATUS_TONE[summary.status]}`}
                  label={getReadinessStatusLabel(summary.status)}
                />
              </div>
              <LinearProgress variant="determinate" value={summary.percent} className={`readiness-progress readiness-progress--${STATUS_TONE[summary.status]}`} />
            </div>

            <Collapse in={expanded} timeout={260}>
              <div className="readiness-expanded">
                <div className="readiness-selected-trip">
                  <span>
                    <small>Selected trip</small>
                    <strong>{country.name} · {tripLabel(selectedPlan)}</strong>
                  </span>
                  <span>
                    <small>Travelers</small>
                    <strong>{summary.travelerCount}</strong>
                  </span>
                </div>

                {readiness.started && criticalMessage && (
                  <Alert severity="warning" className="readiness-alert">
                    <strong>{criticalMessage.title}</strong>
                    <span>{criticalMessage.body}</span>
                  </Alert>
                )}

                {singleTraveler ? (
                  <div className="readiness-checklist">
                    {READINESS_LEVEL_ORDER.map((level) => {
                      const tripTasks = TRIP_READINESS_TASKS.filter((task) => task.level === level)
                      const travelerTasks = TRAVELER_READINESS_TASKS.filter((task) => task.level === level)
                      if (!tripTasks.length && !travelerTasks.length) return null
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
                  <>
                    <div className="readiness-group readiness-group--trip">
                      <div className="readiness-group__heading">
                        <span className="readiness-group__marker" />
                        <strong>Trip-level tasks</strong>
                        <small>{TRIP_READINESS_TASKS.length} checks</small>
                      </div>
                      {TRIP_READINESS_TASKS.map((task) => (
                        <ReadinessTaskRow
                          key={task.id}
                          task={task}
                          checked={readiness.tripTasks[task.id]}
                          onChange={(checked) => setTripTask(task.id, checked)}
                        />
                      ))}
                    </div>
                    <div className="readiness-group readiness-group--travelers">
                      <div className="readiness-group__heading">
                        <span className="readiness-group__marker" />
                        <strong>Traveler readiness</strong>
                        <small>{summary.travelerCount} travelers</small>
                      </div>
                      <TravelerReadinessMatrix readiness={readiness} onToggle={setTravelerTask} />
                    </div>
                  </>
                )}

                {summary.status === 'complete' ? (
                  <div className="readiness-success-callout">
                    <ReadinessSuccessAnimation
                      size={82}
                      playKey={`${selectedPlan.id}-${successPlayKey}`}
                      play={playSuccess}
                    />
                    <span>
                      <strong>You’re fully prepared.</strong>
                      <small>All trip readiness checks are complete. Have a great trip to {country.name}!</small>
                    </span>
                  </div>
                ) : summary.status === 'ready' ? (
                  <div className="readiness-ready-callout">
                    <span className="readiness-ready-callout__check" aria-hidden="true">✓</span>
                    <span>
                      <strong>Essentials confirmed.</strong>
                      <small>You’re ready for this trip. {summary.optionalIncomplete} optional {summary.optionalIncomplete === 1 ? 'step remains' : 'steps remain'}.</small>
                    </span>
                  </div>
                ) : (
                  <div className="readiness-expanded__footer">
                    <span>
                      <strong>{summary.status === 'not-started' ? 'Start whenever you’re ready.' : 'Keep going — every completed check helps.'}</strong>
                      <small>Optional items do not block your Ready status.</small>
                    </span>
                    {readiness.started && (
                      <Button variant="text" color="inherit" onClick={() => dispatch(resetTripReadiness(selectedPlan.id))}>
                        Reset checklist
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Collapse>
          </>
        )}
      </Box>
    </section>
  )
}
