import { useCallback, useEffect, useState } from 'react'
import { memberApi, structureApi } from '../../../api/services'
import { useAuth } from '../../../auth/AuthContext'
import { canManageStructure } from '../../../auth/authStorage'
import type { Member, StructureNode, StructureNodeInput, StructureNodeType, StructureStatus } from '../../../types'
import { Modal, StatusPill, LoadingState, ErrorState } from '../../../components/ui'
import { labelStructureStatus } from '../../../utils/labels'

type NodeForm = StructureNodeInput

const emptyForm: NodeForm = {
  parentId: null,
  name: '',
  type: 'MODULE',
  description: '',
  ownerId: '',
  status: 'PLANNED',
}

export function StructurePage() {
  const { user } = useAuth()
  const canWrite = canManageStructure(user?.role)
  const [members, setMembers] = useState<Member[]>([])
  const [tree, setTree] = useState<StructureNode[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [m, t] = await Promise.all([memberApi.getAll(), structureApi.getTree()])
      setMembers(m)
      setTree(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load structure')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate(parentId: string | null = null) {
    setForm({
      ...emptyForm,
      parentId,
      type: parentId ? 'FEATURE' : 'MODULE',
      ownerId: members[0]?.id ?? '',
    })
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await structureApi.create({
        ...form,
        parentId: form.parentId || null,
        ownerId: form.ownerId || undefined,
      })
      setOpen(false)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Remove ${label}?`)) return
    try {
      await structureApi.remove(id)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <LoadingState text="Loading structure…" />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Project Structure</h2>
          <p>Modules, features, pages, and APIs — who owns what and status.</p>
        </div>
        <div className="header-actions">
          {canWrite ? (
            <button type="button" className="btn btn-primary" onClick={() => openCreate(null)}>
              + Add module
            </button>
          ) : null}
        </div>
      </div>

      <div className="tree">
        {tree.length === 0 ? (
          <div className="panel">
            <div className="empty">No modules yet — add your first module.</div>
          </div>
        ) : (
          tree.map((mod) => (
            <article key={mod.id} className="tree-node">
              <div className="tree-node-head">
                <div>
                  <div className="title">
                    <span className="type-tag">{mod.type}</span>
                    {mod.name}
                    {mod.status ? <StatusPill value={labelStructureStatus(mod.status)} /> : null}
                  </div>
                  {mod.description ? (
                    <div className="muted" style={{ marginTop: 4 }}>
                      {mod.description}
                    </div>
                  ) : null}
                  {mod.owner ? (
                    <div className="muted" style={{ marginTop: 2, fontSize: '0.82rem' }}>
                      Owner: {mod.owner.name}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {canWrite ? (
                    <>
                      <button type="button" className="btn btn-sm" onClick={() => openCreate(mod.id)}>
                        + Child
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => void remove(mod.id, 'this module and its children')}
                      >
                        Del
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              {(mod.children?.length ?? 0) > 0 ? (
                <div className="tree-children">
                  {mod.children.map((child) => (
                    <div key={child.id} className="tree-child">
                      <div>
                        <div className="title" style={{ fontWeight: 600 }}>
                          <span className="type-tag">{child.type}</span> {child.name}
                        </div>
                        <div className="muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>
                          {child.owner?.name ?? 'Unassigned'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {child.status ? <StatusPill value={labelStructureStatus(child.status)} /> : null}
                        {canWrite ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => void remove(child.id, 'this item')}
                          >
                            Del
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty" style={{ padding: '0.85rem' }}>
                  No features yet
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {open ? (
        <Modal
          title={form.parentId ? 'Add feature / page / API' : 'Add module'}
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
          {form.parentId ? (
            <div className="field">
              <label>Parent module</label>
              <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                {tree.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as StructureNodeType })}
              >
                {(form.parentId
                  ? (['FEATURE', 'PAGE', 'API'] as const)
                  : (['MODULE'] as const)
                ).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as StructureStatus })}
              >
                <option value="PLANNED">Planned</option>
                <option value="BUILDING">Building</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Owner</label>
            <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </Modal>
      ) : null}
    </>
  )
}
