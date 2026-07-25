import { useCallback, useEffect, useState } from 'react'
import { meetingApi, memberApi } from '../../../api/services'
import { useAuth } from '../../../auth/AuthContext'
import { useProject } from '../../../auth/ProjectContext'
import { canWriteMeetings } from '../../../auth/authStorage'
import type { ActionItemInput, Meeting, MeetingInput, Member } from '../../../types'
import { Modal, LoadingState, ErrorState } from '../../../components/ui'

type FormState = MeetingInput & {
  actionText: string
  actionOwner: string
  actionDue: string
}

const emptyForm = (): FormState => ({
  projectId: '',
  title: '',
  date: '',
  agenda: '',
  notes: '',
  attendeeIds: [],
  actionItems: [],
  actionText: '',
  actionOwner: '',
  actionDue: '',
})

export function MeetingsPage() {
  const { user } = useAuth()
  const { projectId } = useProject()
  const canWrite = canWriteMeetings(user?.role)
  const [members, setMembers] = useState<Member[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Meeting | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [view, setView] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) {
      setMembers([])
      setMeetings([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [m, mt] = await Promise.all([memberApi.getAll(), meetingApi.getAll(projectId)])
      setMembers(m)
      setMeetings(mt)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm(),
      projectId: projectId!,
      date: new Date().toISOString().slice(0, 10),
      attendeeIds: members.map((m) => m.id),
      actionOwner: members[0]?.id ?? '',
      actionDue: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    })
    setOpen(true)
  }

  function openEdit(m: Meeting) {
    setEditing(m)
    setForm({
      projectId: projectId!,
      title: m.title,
      date: m.date,
      agenda: m.agenda ?? '',
      notes: m.notes ?? '',
      attendeeIds: m.attendees.map((a) => a.id),
      actionItems: m.actionItems.map((a) => ({
        id: a.id,
        text: a.text,
        ownerId: a.owner.id,
        dueDate: a.dueDate,
        done: a.done,
      })),
      actionText: '',
      actionOwner: members[0]?.id ?? '',
      actionDue: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    })
    setOpen(true)
  }

  function toggleAttendee(id: string) {
    setForm((f) => ({
      ...f,
      attendeeIds: f.attendeeIds.includes(id)
        ? f.attendeeIds.filter((a) => a !== id)
        : [...f.attendeeIds, id],
    }))
  }

  function addAction() {
    if (!form.actionText.trim()) return
    const item: ActionItemInput = {
      text: form.actionText.trim(),
      ownerId: form.actionOwner,
      dueDate: form.actionDue,
      done: false,
    }
    setForm((f) => ({ ...f, actionItems: [...f.actionItems, item], actionText: '' }))
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload: MeetingInput = {
      projectId: projectId!,
      title: form.title.trim(),
      date: form.date,
      agenda: form.agenda,
      notes: form.notes,
      attendeeIds: form.attendeeIds,
      actionItems: form.actionItems,
    }
    try {
      if (editing) await meetingApi.update(editing.id, payload)
      else await meetingApi.create(payload)
      setOpen(false)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this meeting minute?')) return
    try {
      await meetingApi.remove(id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  async function toggleDone(meetingId: string, actionId: string) {
    try {
      await meetingApi.toggleAction(meetingId, actionId)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed')
    }
  }

  if (!projectId) return <LoadingState text="Select or create a project" />
  if (loading) return <LoadingState text="Loading meetings…" />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Meeting Minutes</h2>
          <p>Agenda, notes, and action items after each sync.</p>
        </div>
        <div className="header-actions">
          {canWrite ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + New minutes
            </button>
          ) : null}
        </div>
      </div>

      <div className="meeting-list">
        {meetings.length === 0 ? (
          <div className="panel">
            <div className="empty">No meeting minutes yet</div>
          </div>
        ) : (
          meetings.map((m) => (
            <article key={m.id} className="meeting-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <h3>{m.title}</h3>
                  <div className="meta">
                    {m.date} · {m.attendees.map((a) => a.name).join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setView(m)}>
                    View
                  </button>
                  {canWrite ? (
                    <>
                      <button type="button" className="btn btn-sm" onClick={() => openEdit(m)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => void remove(m.id)}>
                        Del
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <p style={{ margin: '0 0 0.5rem' }}>
                <strong>Agenda:</strong> {m.agenda || '—'}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {(m.notes ?? '').slice(0, 160)}
                {(m.notes ?? '').length > 160 ? '…' : ''}
              </p>
              {m.actionItems.length > 0 ? (
                <ul className="action-list">
                  {m.actionItems.map((a) => (
                    <li key={a.id} className={a.done ? 'done' : ''}>
                      <input
                        type="checkbox"
                        checked={a.done}
                        disabled={!canWrite}
                        onChange={() => void toggleDone(m.id, a.id)}
                      />
                      <div>
                        <div>{a.text}</div>
                        <div className="muted" style={{ fontSize: '0.78rem' }}>
                          {a.owner.name} · due {a.dueDate}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))
        )}
      </div>

      {view ? (
        <Modal title={view.title} onClose={() => setView(null)} wide>
          <div className="meta">
            {view.date} · Attendees: {view.attendees.map((a) => a.name).join(', ')}
          </div>
          <div className="field">
            <label>Agenda</label>
            <div>{view.agenda || '—'}</div>
          </div>
          <div className="field">
            <label>Notes</label>
            <div style={{ whiteSpace: 'pre-wrap' }}>{view.notes || '—'}</div>
          </div>
          <div className="field">
            <label>Action items</label>
            {view.actionItems.length === 0 ? (
              <div className="muted">None</div>
            ) : (
              <ul className="action-list">
                {view.actionItems.map((a) => (
                  <li key={a.id} className={a.done ? 'done' : ''}>
                    <span>{a.done ? '✓' : '○'}</span>
                    <div>
                      {a.text}
                      <div className="muted" style={{ fontSize: '0.78rem' }}>
                        {a.owner.name} · {a.dueDate}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal>
      ) : null}

      {open ? (
        <Modal
          title={editing ? 'Edit meeting minutes' : 'New meeting minutes'}
          onClose={() => setOpen(false)}
          wide
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
          <div className="field-row">
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Attendees</label>
            <div className="check-group">
              {members.map((m) => (
                <label key={m.id}>
                  <input
                    type="checkbox"
                    checked={form.attendeeIds.includes(m.id)}
                    onChange={() => toggleAttendee(m.id)}
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Agenda</label>
            <textarea rows={2} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="field">
            <label>Action items</label>
            <ul className="action-list">
              {form.actionItems.map((a, idx) => (
                <li key={`${a.text}-${idx}`}>
                  <div>
                    {a.text}
                    <div className="muted" style={{ fontSize: '0.78rem' }}>
                      {members.find((m) => m.id === a.ownerId)?.name ?? a.ownerId} · {a.dueDate}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        actionItems: f.actionItems.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    Rem
                  </button>
                </li>
              ))}
            </ul>
            <div className="field-row" style={{ marginTop: '0.5rem' }}>
              <div className="field">
                <label>New action</label>
                <input
                  value={form.actionText}
                  onChange={(e) => setForm({ ...form, actionText: e.target.value })}
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="field">
                <label>Owner</label>
                <select value={form.actionOwner} onChange={(e) => setForm({ ...form, actionOwner: e.target.value })}>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Due</label>
                <input
                  type="date"
                  value={form.actionDue}
                  onChange={(e) => setForm({ ...form, actionDue: e.target.value })}
                />
              </div>
              <div className="field" style={{ alignSelf: 'end' }}>
                <button type="button" className="btn" onClick={addAction}>
                  Add action item
                </button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
