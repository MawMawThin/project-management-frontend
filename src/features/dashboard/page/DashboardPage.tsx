import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi, scheduleApi, bugApi } from '../../../api/services'
import { useProject } from '../../../auth/ProjectContext'
import type { DashboardSummary, ScheduleTask, Bug } from '../../../types'
import { PriorityPill, StatusPill, LoadingState, ErrorState } from '../../../components/ui'
import { labelBugStatus, labelTaskStatus } from '../../../utils/labels'

export function DashboardPage() {
  const { projectId } = useProject()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [tasks, setTasks] = useState<ScheduleTask[]>([])
  const [bugs, setBugs] = useState<Bug[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId) {
      setSummary(null)
      setTasks([])
      setBugs([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [s, t, b] = await Promise.all([
        dashboardApi.getSummary(projectId),
        scheduleApi.getAll(projectId),
        bugApi.getAll(projectId),
      ])
      setSummary(s)
      setTasks(t.filter((x) => x.status !== 'DONE').slice(0, 5))
      setBugs(
        b
          .filter((x) => x.status === 'OPEN' || x.status === 'IN_PROGRESS' || x.status === 'REOPENED')
          .sort((a, c) => Number(c.level === 'HIGH') - Number(a.level === 'HIGH'))
          .slice(0, 5),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  if (!projectId) return <LoadingState text="Select or create a project" />
  if (loading) return <LoadingState text="Loading dashboard…" />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Live data from Project Management backend.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="label">Active tasks</div>
          <div className="value">{summary?.activeTasks ?? 0}</div>
          <div className="hint">Assigned by leader</div>
        </div>
        <div className="stat-card">
          <div className="label">Open bugs</div>
          <div className="value">{summary?.openBugs ?? 0}</div>
          <div className="hint">Needs attention</div>
        </div>
        <div className="stat-card">
          <div className="label">Modules</div>
          <div className="value">{summary?.modules ?? 0}</div>
          <div className="hint">Project structure</div>
        </div>
        <div className="stat-card">
          <div className="label">Action items</div>
          <div className="value">{summary?.openActionItems ?? 0}</div>
          <div className="hint">From meeting minutes</div>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>Schedule</h3>
            <Link to="/schedule" className="btn btn-sm">
              Open
            </Link>
          </div>
          <div className="panel-body">
            {tasks.length === 0 ? (
              <div className="empty">No active tasks</div>
            ) : (
              <ul className="dash-list">
                {tasks.map((t) => (
                  <li key={t.id}>
                    <div>
                      <strong>{t.title}</strong>
                      <div className="muted">
                        {t.assignedTo.name} · due {t.dueDate}
                      </div>
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

        <section className="panel">
          <div className="panel-head">
            <h3>Priority bugs</h3>
            <Link to="/bugs" className="btn btn-sm">
              Open
            </Link>
          </div>
          <div className="panel-body">
            {bugs.length === 0 ? (
              <div className="empty">No open bugs</div>
            ) : (
              <ul className="dash-list">
                {bugs.map((b) => (
                  <li key={b.id}>
                    <div>
                      <strong>{b.name}</strong>
                      <div className="muted">
                        {b.detail.slice(0, 80)}
                        {b.detail.length > 80 ? '…' : ''}
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
          </div>
        </section>
      </div>
    </>
  )
}
