import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { canManageMembers } from '../../auth/authStorage'
import { labelRole } from '../../utils/labels'

export function Layout() {
  const { user, logout } = useAuth()

  const links = [
    { to: '/', label: 'My Work', icon: '★', end: true },
    { to: '/dashboard', label: 'Dashboard', icon: '▣', end: false },
    { to: '/schedule', label: 'Schedule Plan', icon: '▤', end: false },
    { to: '/bugs', label: 'Bug List', icon: '⚠', end: false },
    { to: '/structure', label: 'Project Structure', icon: '⧉', end: false },
    { to: '/meetings', label: 'Meeting Minutes', icon: '✎', end: false },
    ...(canManageMembers(user?.role)
      ? [{ to: '/members', label: 'Team Members', icon: '☺', end: false }]
      : []),
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Project Management</h1>
          <p>Schedule · Bugs · Structure · Minutes</p>
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
          <div style={{ marginTop: 8, opacity: 0.7 }}>API · localhost:8080</div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
