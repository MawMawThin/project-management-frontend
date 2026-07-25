import { useCallback, useEffect, useMemo, useState } from 'react'
import { bugApi, memberApi } from '../../../api/services'
import { useAuth } from '../../../auth/AuthContext'
import { useProject } from '../../../auth/ProjectContext'
import { canDeleteBugs, canWriteBugs, isLeader } from '../../../auth/authStorage'
import type { Bug, BugInput, BugPhase, BugStatus, Member, PriorityLevel } from '../../../types'
import { Modal, PriorityPill, StatusPill, LoadingState, ErrorState } from '../../../components/ui'
import { labelBugStatus, labelPhase } from '../../../utils/labels'

const phases: BugPhase[] = ['PHASE_1', 'PHASE_2', 'DEV', 'SYSTEM_ADMIN']
const levels: PriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH']
const statuses: BugStatus[] = ['OPEN', 'IN_PROGRESS', 'FIXED', 'CLOSED', 'REOPENED']

const emptyForm: BugInput = {
  projectId: '',
  name: '',
  detail: '',
  level: 'MEDIUM',
  status: 'OPEN',
  phase: 'PHASE_2',
  assigneeIds: [],
}

export function BugsPage() {
  const { user } = useAuth()
  const { projectId } = useProject()
  const canWrite = canWriteBugs(user?.role)
  const canDelete = canDeleteBugs(user?.role)
  const leader = isLeader(user?.role)
  const [members, setMembers] = useState<Member[]>([])
  const [bugs, setBugs] = useState<Bug[]>([])
  const [phase, setPhase] = useState<BugPhase | 'ALL'>('PHASE_2')
  const [scope, setScope] = useState<'mine' | 'all'>(leader || user?.role === 'QA' ? 'all' : 'mine')
  const [level, setLevel] = useState('all')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bug | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function canEditBug(bug: Bug) {
    if (leader || user?.role === 'QA') return true
    return bug.assignees.some((a) => a.id === user?.id)
  }

  const load = useCallback(async () => {
    if (!projectId) {
      setMembers([])
      setBugs([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [m, b] = await Promise.all([memberApi.getAll(), bugApi.getAll(projectId, phase)])
      setMembers(m)
      setBugs(b)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bugs')
    } finally {
      setLoading(false)
    }
  }, [projectId, phase])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    return bugs.filter((b) => {
      const q = query.toLowerCase()
      const matchQ = !q || b.name.toLowerCase().includes(q) || b.detail?.toLowerCase().includes(q)
      const matchMine = scope === 'all' || b.assignees.some((a) => a.id === user?.id)
      const matchL = level === 'all' || b.level === level
      const matchS = status === 'all' || b.status === status
      return matchQ && matchMine && matchL && matchS
    })
  }, [bugs, query, scope, user?.id, level, status])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm,
      projectId: projectId!,
      phase: phase === 'ALL' ? 'PHASE_2' : phase,
      assigneeIds: [members.find((m) => m.role === 'DEVELOPER')?.id ?? members[0]?.id].filter(Boolean) as string[],
    })
    setOpen(true)
  }

  function openEdit(bug: Bug) {
    setEditing(bug)
    setForm({
      projectId: projectId!,
      name: bug.name,
      detail: bug.detail ?? '',
      level: bug.level,
      status: bug.status,
      phase: bug.phase,
      assigneeIds: bug.assignees.map((a) => a.id),
    })
    setOpen(true)
  }

  function toggleAssignee(id: string) {
    setForm((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id)
        ? f.assigneeIds.filter((a) => a !== id)
        : [...f.assigneeIds, id],
    }))
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) await bugApi.update(editing.id, form)
      else await bugApi.create(form)
      setOpen(false)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this bug?')) return
    try {
      await bugApi.remove(id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (!projectId) return <LoadingState text="Select or create a project" />
  if (loading) return <LoadingState text="Loading bugs…" />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Bug List</h2>
          <p>Defects found in features — fix tracking by assignee.</p>
        </div>
        <div className="header-actions">
          {canWrite ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Add bug
            </button>
          ) : null}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '0.85rem' }}>
        <button type="button" className={`tab${phase === 'ALL' ? ' active' : ''}`} onClick={() => setPhase('ALL')}>
          All phases
        </button>
        {phases.map((p) => (
          <button
            key={p}
            type="button"
            className={`tab${phase === p ? ' active' : ''}`}
            onClick={() => setPhase(p)}
          >
            {labelPhase(p)}
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>{phase === 'ALL' ? 'All bugs' : labelPhase(phase)}</h3>
          <div className="filters">
            <select value={scope} onChange={(e) => setScope(e.target.value as 'mine' | 'all')}>
              <option value="mine">My bugs</option>
              <option value="all">All bugs</option>
            </select>
            <input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="all">All levels</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {labelBugStatus(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>No</th>
                <th>Name</th>
                <th>Detail</th>
                <th>Level</th>
                <th>Status</th>
                <th>Assign</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty">
                    No bugs in this view
                  </td>
                </tr>
              ) : (
                filtered.map((b, i) => (
                  <tr key={b.id}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{b.name}</strong>
                      {phase === 'ALL' ? <div className="muted">{labelPhase(b.phase)}</div> : null}
                    </td>
                    <td className="detail">{b.detail}</td>
                    <td>
                      <PriorityPill value={b.level} />
                    </td>
                    <td>
                      <StatusPill value={labelBugStatus(b.status)} />
                    </td>
                    <td>
                      <div className="assignees">
                        {b.assignees.map((a) => (
                          <span key={a.id} className="assignee-chip">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {canEditBug(b) ? (
                        <button type="button" className="btn btn-sm" onClick={() => openEdit(b)}>
                          Edit
                        </button>
                      ) : (
                        <span className="muted">View only</span>
                      )}{' '}
                      {canDelete ? (
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => void remove(b.id)}>
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
          title={editing ? 'Edit bug' : 'Add bug'}
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
            <label>Name (feature / screen)</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Detail</label>
            <textarea rows={3} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Phase</label>
              <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value as BugPhase })}>
                {phases.map((p) => (
                  <option key={p} value={p}>
                    {labelPhase(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as PriorityLevel })}
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as BugStatus })}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {labelBugStatus(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Assign</label>
            <div className="check-group">
              {members.map((m) => (
                <label key={m.id}>
                  <input
                    type="checkbox"
                    checked={form.assigneeIds.includes(m.id)}
                    disabled={!!editing && !(leader || user?.role === 'QA')}
                    onChange={() => toggleAssignee(m.id)}
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
