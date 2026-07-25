import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useProject } from '../../auth/ProjectContext'
import { canManageMembers } from '../../auth/authStorage'
import { labelRole } from '../../utils/labels'

export function Layout() {
  const { user, logout } = useAuth()
  const { projects, projectId, setProjectId, project } = useProject()
  const [menuOpen, setMenuOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const projectRef = useRef<HTMLDivElement>(null)

  const initial =
    user?.name.trim().charAt(0).toUpperCase() ||
    user?.username.charAt(0).toUpperCase() ||
    '?'

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

  useEffect(() => {
    if (!menuOpen && !projectOpen) return

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (menuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
      if (projectOpen && projectRef.current && !projectRef.current.contains(target)) {
        setProjectOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setProjectOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, projectOpen])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Project Management</h1>
          <p>Schedule · Bugs · Structure · Minutes</p>
        </div>
        <div className="project-switcher" ref={projectRef}>
          <span className="project-switcher-label" id="project-switcher-label">
            Current project
          </span>
          <button
            type="button"
            className="project-switcher-trigger"
            aria-labelledby="project-switcher-label"
            aria-haspopup="listbox"
            aria-expanded={projectOpen}
            disabled={!projects.length}
            onClick={() => setProjectOpen((open) => !open)}
          >
            <span className="project-switcher-value">
              {project?.name ?? (projects.length ? 'Select project' : 'No projects')}
            </span>
            <span className="project-switcher-caret" aria-hidden>
              ▾
            </span>
          </button>
          {projectOpen && projects.length > 0 ? (
            <ul className="project-switcher-menu" role="listbox" aria-labelledby="project-switcher-label">
              {projects.map((p) => (
                <li key={p.id} role="option" aria-selected={p.id === projectId}>
                  <button
                    type="button"
                    className={p.id === projectId ? 'is-active' : undefined}
                    onClick={() => {
                      setProjectId(p.id)
                      setProjectOpen(false)
                    }}
                  >
                    <span className="project-option-name">{p.name}</span>
                    <span className="project-option-status">{p.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {project ? <div className="project-switcher-status">{project.status}</div> : null}
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-project">
            <span className="topbar-kicker">Working in</span>
            <strong>{project?.name ?? 'No project'}</strong>
          </div>

          {user ? (
            <div className="profile-menu" ref={menuRef}>
              <button
                type="button"
                className="profile-trigger"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="profile-trigger-text">
                  <span className="profile-trigger-kicker">Account</span>
                  <strong>{user.name}</strong>
                </span>
                <span className="profile-avatar" aria-hidden>
                  {initial}
                </span>
                <span className="profile-caret" aria-hidden>
                  ▾
                </span>
              </button>

              {menuOpen ? (
                <div className="profile-popover" role="menu">
                  <button
                    type="button"
                    className="profile-popover-close"
                    aria-label="Close account menu"
                    onClick={() => setMenuOpen(false)}
                  >
                    ×
                  </button>
                  <div className="profile-popover-avatar" aria-hidden>
                    {initial}
                  </div>
                  <p className="profile-hello">Hi, {user.name.split(' ')[0]}!</p>
                  <p className="profile-email">
                    {labelRole(user.role)} · @{user.username}
                  </p>
                  <button
                    type="button"
                    className="profile-signout"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
