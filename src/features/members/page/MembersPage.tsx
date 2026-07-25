import { useCallback, useEffect, useState } from 'react'
import { memberApi } from '../../../api/services'
import { useAuth } from '../../../auth/AuthContext'
import { canManageMembers } from '../../../auth/authStorage'
import type { Member, MemberRole } from '../../../types'
import { Modal, LoadingState, ErrorState } from '../../../components/ui'
import { labelRole } from '../../../utils/labels'
import { Navigate } from 'react-router-dom'

const roles: MemberRole[] = ['LEADER', 'DEVELOPER', 'QA']

type FormState = {
  name: string
  username: string
  password: string
  role: MemberRole
}

const emptyForm: FormState = {
  name: '',
  username: '',
  password: '',
  role: 'DEVELOPER',
}

export function MembersPage() {
  const { user } = useAuth()
  const canWrite = canManageMembers(user?.role)

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setMembers(await memberApi.getAll())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (!canWrite) {
    return <Navigate to="/" replace />
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, role: 'DEVELOPER', password: 'Pass123!' })
    setOpen(true)
  }

  function openEdit(m: Member) {
    setEditing(m)
    setForm({
      name: m.name,
      username: m.username ?? '',
      password: '',
      role: m.role,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim() || !form.username.trim()) return
    if (!editing && !form.password.trim()) {
      alert('Password is required for new user')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await memberApi.update(editing.id, {
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          password: form.password.trim() || undefined,
          role: form.role,
        })
      } else {
        await memberApi.create({
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          password: form.password,
          role: form.role,
        })
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
    if (!confirm('Delete this team member?')) return
    try {
      await memberApi.remove(id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <LoadingState text="Loading team…" />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Team Members</h2>
          <p>Add developers here — they will appear in Assign select boxes.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Add member
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td>
                    <code>{m.username}</code>
                  </td>
                  <td>{labelRole(m.role)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-sm" onClick={() => openEdit(m)}>
                      Edit
                    </button>{' '}
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => void remove(m.id)}>
                      Del
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {open ? (
        <Modal
          title={editing ? 'Edit member' : 'Add member'}
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
            <label>Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Username (for login)</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="field">
            <label>{editing ? 'New password (optional)' : 'Password'}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editing ? 'Leave blank to keep current' : ''}
            />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as MemberRole })}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {labelRole(r)}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
