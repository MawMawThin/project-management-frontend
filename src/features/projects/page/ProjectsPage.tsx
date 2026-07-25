import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { projectApi } from '../../../api/services'
import { useAuth } from '../../../auth/AuthContext'
import { useProject } from '../../../auth/ProjectContext'
import { canManageMembers } from '../../../auth/authStorage'
import type { Project } from '../../../types'
import { Modal, LoadingState, ErrorState } from '../../../components/ui'

export function ProjectsPage() {
  const { user } = useAuth()
  const { projects, refreshProjects, loading, error, setProjectId } = useProject()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [saving, setSaving] = useState(false)

  if (!canManageMembers(user?.role)) {
    return <Navigate to="/" replace />
  }

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setStatus('ACTIVE')
    setOpen(true)
  }

  function openEdit(p: Project) {
    setEditing(p)
    setName(p.name)
    setDescription(p.description ?? '')
    setStatus(p.status || 'ACTIVE')
    setOpen(true)
  }

  async function save() {
    if (!name.trim()) {
      alert('Project name is required')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        status,
      }
      if (editing) {
        await projectApi.update(editing.id, body)
      } else {
        const created = await projectApi.create(body)
        setProjectId(created.id)
      }
      await refreshProjects()
      setOpen(false)
      setEditing(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this project? Work items linked to it may block delete.')) return
    try {
      await projectApi.remove(id)
      await refreshProjects()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading && projects.length === 0) return <LoadingState text="Loading projects…" />
  if (error && projects.length === 0) return <ErrorState message={error} onRetry={() => void refreshProjects()} />

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Projects</h2>
          <p>Create, rename, or switch projects. Each has its own bugs, schedule, structure, and meetings.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + New project
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.description || '—'}</td>
                  <td>{p.status}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="btn btn-sm" onClick={() => setProjectId(p.id)}>
                      Open
                    </button>{' '}
                    <button type="button" className="btn btn-sm" onClick={() => openEdit(p)}>
                      Edit
                    </button>{' '}
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => void remove(p.id)}>
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
          title={editing ? 'Edit project' : 'New project'}
          onClose={() => {
            setOpen(false)
            setEditing(null)
          }}
          footer={
            <>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setOpen(false)
                  setEditing(null)
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
                {saving ? 'Saving…' : editing ? 'Save' : 'Create'}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
