import { useState } from 'react'
import { Checkbox, LinearProgress } from '@mui/material'
import { TRAVELER_READINESS_TASKS, getTravelerSummary } from '../../utils/tripReadiness.js'
import ReadinessIcon from './ReadinessIcon.jsx'
import TripUiIcon from './TripUiIcon.jsx'

const shortTaskLabel = (taskId) => ({
  travelDocument: 'Document',
  entryRequirements: 'Entry req.',
  insurance: 'Insurance',
}[taskId] || taskId)

export default function TravelerReadinessMatrix({ readiness, onToggle }) {
  const [expandedTravelerId, setExpandedTravelerId] = useState('')

  return (
    <div className={`readiness-traveler-matrix${readiness.travelers.length > 5 ? ' readiness-traveler-matrix--scroll' : ''}`}>
      <div className="readiness-traveler-matrix__table" role="table" aria-label="Traveler readiness">
        <div className="readiness-traveler-matrix__row readiness-traveler-matrix__row--head" role="row">
          <span role="columnheader">Traveler</span>
          {TRAVELER_READINESS_TASKS.map((task) => (
            <span key={task.id} role="columnheader" title={task.label}>
              <ReadinessIcon name={task.icon} tone={task.level} size={30} />
              <small>{shortTaskLabel(task.id)}</small>
            </span>
          ))}
          <span role="columnheader">Progress</span>
        </div>
        {readiness.travelers.map((traveler) => {
          const summary = getTravelerSummary(traveler, readiness.started)
          return (
            <div className="readiness-traveler-matrix__row" role="row" key={traveler.id}>
              <strong role="rowheader">{traveler.name}</strong>
              {TRAVELER_READINESS_TASKS.map((task) => (
                <span role="cell" key={task.id}>
                  <Checkbox
                    checked={traveler.tasks[task.id]}
                    onChange={(event) => onToggle(traveler.id, task.id, event.target.checked)}
                    size="small"
                    inputProps={{ 'aria-label': `${traveler.name}: ${task.label}` }}
                  />
                </span>
              ))}
              <span className="readiness-traveler-matrix__progress" role="cell">
                <small>{summary.completed}/{summary.total}</small>
                <LinearProgress variant="determinate" value={summary.percent} />
              </span>
            </div>
          )
        })}
      </div>

      <div className="readiness-traveler-cards" aria-label="Traveler readiness">
        {readiness.travelers.map((traveler) => {
          const summary = getTravelerSummary(traveler, readiness.started)
          const expanded = expandedTravelerId === traveler.id
          return (
            <div className="readiness-traveler-card" key={traveler.id}>
              <button
                type="button"
                className="readiness-traveler-card__summary"
                aria-expanded={expanded}
                onClick={() => setExpandedTravelerId((current) => (current === traveler.id ? '' : traveler.id))}
              >
                <span>
                  <strong>{traveler.name}</strong>
                  <small>{readiness.started ? `${summary.completed}/${summary.total} completed` : 'Not started'}</small>
                </span>
                <span className="readiness-traveler-card__progress">
                  <LinearProgress variant="determinate" value={summary.percent} />
                </span>
                <span className={`readiness-traveler-card__chevron${expanded ? ' readiness-traveler-card__chevron--up' : ''}`} aria-hidden="true">
                  <TripUiIcon name="chevronDown" size={18} />
                </span>
              </button>

              {expanded && (
                <div className="readiness-traveler-card__tasks">
                  {TRAVELER_READINESS_TASKS.map((task) => (
                    <label className="readiness-traveler-card__task" key={task.id}>
                      <span className="readiness-traveler-card__task-icon">
                        <ReadinessIcon name={task.icon} tone={task.level} size={30} />
                      </span>
                      <span>{task.label}</span>
                      <Checkbox
                        checked={traveler.tasks[task.id]}
                        onChange={(event) => onToggle(traveler.id, task.id, event.target.checked)}
                        size="small"
                        inputProps={{ 'aria-label': `${traveler.name}: ${task.label}` }}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
