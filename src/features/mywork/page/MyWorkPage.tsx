import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { bugApi, scheduleApi } from '../../../api/services'
import { useAuth } from '../../../auth/AuthContext'
import type { Bug, ScheduleTask } from '../../../types'
import { PriorityPill, StatusPill, LoadingState, ErrorState } from '../../../components/ui'
import { labelBugStatus, labelTaskStatus } from '../../../utils/labels'

export function MyWorkPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<ScheduleTask[]>([])
  const [bugs, setBugs] = useState<Bug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [t, b] = await Promise.all([scheduleApi.getAll(), bugApi.getAll('ALL')])
      setTasks(t)
      setBugs(b)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load My Work')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const myHighBugs = useMemo(() => {
    return bugs
      .filter(
        (b) =>
          b.assignees.some((a) => a.id === user?.id) &&
          b.level === 'HIGH' &&
          b.status !== 'FIXED' &&
          b.status !== 'CLOSED',
      )
      .sort((a, c) => a.name.localeCompare(c.name))
  }, [bugs, user?.id])

  const myOtherBugs = useMemo(() => {
    return bugs
      .filter(
        (b) =>
          b.assignees.some((a) => a.id === user?.id) &&
          b.level !== 'HIGH' &&
          b.status !== 'FIXED' &&
          b.status !== 'CLOSED',
      )
      .sort((a, c) => Number(c.level === 'MEDIUM') - Number(a.level === 'MEDIUM'))
  }, [bugs, user?.id])

  const myTasks = useMemo(() => {
    return tasks
      .filter((t) => t.assignedTo.id === user?.id && t.status !== 'DONE')
      .sort((a, c) => (a.dueDate ?? '').localeCompare(c.dueDate ?? ''))
  }, [tasks, user?.id])

  if (loading) return <LoadingState text="Loading your work…" />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <div className="page-header">
        <div>
          <h2>My Work</h2>
          <p>
            Hi {user?.name} — do <strong>High bugs</strong> first, then schedule tasks.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="stat-card">
          <div className="label">High bugs</div>
          <div className="value">{myHighBugs.length}</div>
          <div className="hint">Do these first</div>
        </div>
        <div className="stat-card">
          <div className="label">Other open bugs</div>
          <div className="value">{myOtherBugs.length}</div>
          <div className="hint">Medium / Low</div>
        </div>
        <div className="stat-card">
          <div className="label">Schedule tasks</div>
          <div className="value">{myTasks.length}</div>
          <div className="hint">Not done yet</div>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>1. High bugs (fix first)</h3>
            <Link to="/bugs" className="btn btn-sm">
              Bug List
            </Link>
          </div>
          <div className="panel-body">
            {myHighBugs.length === 0 ? (
              <div className="empty">No high bugs assigned to you 👍</div>
            ) : (
              <ul className="dash-list">
                {myHighBugs.map((b) => (
                  <li key={b.id}>
                    <div>
                      <strong>{b.name}</strong>
                      <div className="muted">
                        {b.detail.slice(0, 90)}
                        {b.detail.length > 90 ? '…' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <PriorityPill value={b.level} />
                      <StatusPill value={labelBugStatus(b.status)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {myOtherBugs.length > 0 ? (
              <>
                <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.92rem' }}>Other open bugs</h4>
                <ul className="dash-list">
                  {myOtherBugs.slice(0, 5).map((b) => (
                    <li key={b.id}>
                      <div>
                        <strong>{b.name}</strong>
                        <div className="muted">{labelBugStatus(b.status)}</div>
                      </div>
                      <PriorityPill value={b.level} />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>2. Schedule tasks</h3>
            <Link to="/schedule" className="btn btn-sm">
              Schedule
            </Link>
          </div>
          <div className="panel-body">
            {myTasks.length === 0 ? (
              <div className="empty">No open schedule tasks</div>
            ) : (
              <ul className="dash-list">
                {myTasks.map((t) => (
                  <li key={t.id}>
                    <div>
                      <strong>{t.title}</strong>
                      <div className="muted">Due {t.dueDate}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <PriorityPill value={t.priority} />
                      <StatusPill value={labelTaskStatus(t.status)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
