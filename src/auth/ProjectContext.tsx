import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { projectApi } from '../api/services'
import type { Project } from '../types'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'pm_project_id'

type ProjectContextValue = {
  projects: Project[]
  projectId: string | null
  project: Project | null
  setProjectId: (id: string) => void
  refreshProjects: () => Promise<void>
  loading: boolean
  error: string
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectIdState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshProjects = useCallback(async () => {
    if (!user) {
      setProjects([])
      return
    }
    setLoading(true)
    setError('')
    try {
      const list = await projectApi.getAll()
      setProjects(list)
      const stored = localStorage.getItem(STORAGE_KEY)
      const stillValid = stored && list.some((p) => p.id === stored)
      if (stillValid) {
        setProjectIdState(stored)
      } else if (list[0]) {
        setProjectIdState(list[0].id)
        localStorage.setItem(STORAGE_KEY, list[0].id)
      } else {
        setProjectIdState(null)
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void refreshProjects()
  }, [refreshProjects])

  const setProjectId = useCallback((id: string) => {
    setProjectIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId])

  const value = useMemo(
    () => ({ projects, projectId, project, setProjectId, refreshProjects, loading, error }),
    [projects, projectId, project, setProjectId, refreshProjects, loading, error],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
