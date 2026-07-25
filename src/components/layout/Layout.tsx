import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useProject } from '../../auth/ProjectContext'
import { canManageMembers } from '../../auth/authStorage'
import { labelRole } from '../../utils/labels'
import { API_BASE_URL } from '../../api/client'

export function Layout() {
  const { user, logout } = useAuth()
  const { projects, projectId, setProjectId, project } = useProject()

  const links = [
    { to: '/', label: 'My Work', icon: '★', end: true },
    { to: '/dashboard', label: 'Dashboard', icon: '▣', end: false },
    { to: '/schedule', label: 'Schedule Plan', icon: '▤', end: false },
    { to: '/bugs', label: 'Bug List', icon: '⚠', end: false },
    { to: '/structure', label: 'Project Structure', icon: '⧉', end: false },
    { to: '/meetings', label: 'Meeting Minutes', icon: '✎', end: false },
    ...(canManageMembers(user?.role)
      ? [
          { to: '/projects', label: 'Projects', icon: '▣', end: false },
          { to: '/members', label: 'Team Members', icon: '☺', end: false },
        ]
      : []),
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Project Management</h1>
          <p>Schedule · Bugs · Structure · Minutes</p>
        </div>
        <div className="project-switcher" style={{ padding: '0 16px 12px' }}>
          <label className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
            Current project
          </label>
          <select
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ width: '100%' }}
            disabled={!projects.length}
          >
            {projects.length === 0 ? <option value="">No projects</option> : null}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {project ? (
            <div className="muted" style={{ fontSize: 11, marginTop: 4, color: '#9db0c2' }}>
              {project.status}
            </div>
          ) : null}
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {user ? (
            <div className="user-box">
              <div>
                <strong>{user.name}</strong>
                <div className="muted" style={{ color: '#9db0c2' }}>
                  {labelRole(user.role)} · @{user.username}
                </div>
              </div>
              <button type="button" className="btn btn-sm" onClick={logout} style={{ marginTop: 8 }}>
                Logout
              </button>
            </div>
          ) : null}
          <div style={{ marginTop: 8, opacity: 0.7, fontSize: 11, wordBreak: 'break-all' }}>{API_BASE_URL}</div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
