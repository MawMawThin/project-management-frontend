import { useCallback, useEffect, useMemo, useState } from 'react'
import { memberApi, scheduleApi } from '../../../api/services'
import { useAuth } from '../../../auth/AuthContext'
import { canCreateSchedule, isLeader } from '../../../auth/authStorage'
import type { Member, PriorityLevel, ScheduleTask, ScheduleTaskInput, TaskStatus } from '../../../types'
import { Modal, PriorityPill, StatusPill, LoadingState, ErrorState } from '../../../components/ui'
import { labelTaskStatus } from '../../../utils/labels'

const priorities: PriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH']
const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']

const emptyForm: ScheduleTaskInput = {
  title: '',
  description: '',
  assignedById: '',
  assignedToId: '',
  startDate: '',
  dueDate: '',
  priority: 'MEDIUM',
  status: 'TODO',
}

export function SchedulePage() {
  const { user } = useAuth()
  const leader = isLeader(user?.role)
  const canCreate = canCreateSchedule(user?.role)
  const [members, setMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<ScheduleTask[]>([])
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'mine' | 'all'>(leader ? 'all' : 'mine')
  const [assignee, setAssignee] = useState('all')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ScheduleTask | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const leaders = members.filter((m) => m.role === 'LEADER')
  const developers = members.filter((m) => m.role === 'DEVELOPER')

  function canEditTask(task: ScheduleTask) {
    return leader || task.assignedTo.id === user?.id
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [m, t] = await Promise.all([memberApi.getAll(), scheduleApi.getAll()])
      setMembers(m)
      setTasks(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const q = query.toLowerCase()
      const matchQ = !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      const matchMine = scope === 'all' || t.assignedTo.id === user?.id
      const matchA = assignee === 'all' || t.assignedTo.id === assignee
      const matchS = status === 'all' || t.status === status
      return matchQ && matchMine && matchA && matchS
    })
  }, [tasks, query, scope, user?.id, assignee, status])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      assignedById: leaders[0]?.id ?? '',
      assignedToId: developers[0]?.id ?? '',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    })
    setOpen(true)
  }

  function openEdit(task: ScheduleTask) {
    setEditing(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      assignedById: task.assignedBy.id,
      assignedToId: task.assignedTo.id,
      startDate: task.startDate,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await scheduleApi.update(editing.id, form)
      } else {
        await scheduleApi.create(form)
      }
      setOpen(false)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this schedule item?')) return
    try {
      await scheduleApi.remove(id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <LoadingState text="Loading schedule…" />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Schedule Plan</h2>
          <p>Planned work from leader to developers (dates + ownership).</p>
        </div>
        <div className="header-actions">
          {canCreate ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Assign task
            </button>
          ) : null}
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Team schedule</h3>
          <div className="filters">
            <select value={scope} onChange={(e) => setScope(e.target.value as 'mine' | 'all')}>
              <option value="mine">My tasks</option>
              <option value="all">All tasks</option>
            </select>
            <input placeholder="Search tasks…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="all">All assignees</option>
              {developers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {labelTaskStatus(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Task</th>
                <th>From (Leader)</th>
                <th>Assign to</th>
                <th>Start</th>
                <th>Due</th>
                <th>Level</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    No tasks match filters
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.title}</strong>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {t.description}
                      </div>
                    </td>
                    <td>{t.assignedBy.name}</td>
                    <td>{t.assignedTo.name}</td>
                    <td>{t.startDate}</td>
                    <td>{t.dueDate}</td>
                    <td>
                      <PriorityPill value={t.priority} />
                    </td>
                    <td>
                      <StatusPill value={labelTaskStatus(t.status)} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {canEditTask(t) ? (
                        <button type="button" className="btn btn-sm" onClick={() => openEdit(t)}>
                          Edit
                        </button>
                      ) : (
                        <span className="muted">View only</span>
                      )}{' '}
                      {leader ? (
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => void remove(t.id)}>
                          Del
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {open ? (
        <Modal
          title={editing ? 'Edit schedule task' : 'Assign schedule task'}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field">
            <label>Detail</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Assigned by (Leader)</label>
              <select
                value={form.assignedById}
                disabled={!leader}
                onChange={(e) => setForm({ ...form, assignedById: e.target.value })}
              >
                {leaders.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Assign to</label>
              <select
                value={form.assignedToId}
                disabled={!leader}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              >
                {developers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Start date</label>
              <input
                type="date"
                value={form.startDate}
                disabled={!leader}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Due date</label>
              <input
                type="date"
                value={form.dueDate}
                disabled={!leader}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as PriorityLevel })}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {labelTaskStatus(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
