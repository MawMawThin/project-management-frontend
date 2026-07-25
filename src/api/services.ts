import { api } from './client'
import type {
  Bug,
  BugInput,
  BugPhase,
  DashboardSummary,
  Meeting,
  MeetingInput,
  Member,
  Project,
  ProjectInput,
  ScheduleTask,
  ScheduleTaskInput,
  StructureNode,
  StructureNodeInput,
} from '../types'

function withProject(path: string, projectId: string, extra?: string) {
  const q = new URLSearchParams({ projectId })
  if (extra) {
    const [key, value] = extra.split('=')
    if (key && value) q.set(key, value)
  }
  return `${path}?${q.toString()}`
}

export const dashboardApi = {
  getSummary: (projectId: string) => api.get<DashboardSummary>(withProject('/dashboard', projectId)),
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{
      token: string
      id: string
      name: string
      username: string
      role: import('../types').MemberRole
    }>('/auth/login', { username, password }),
}

export const projectApi = {
  getAll: () => api.get<Project[]>('/projects'),
  create: (body: ProjectInput) => api.post<Project>('/projects', body),
  update: (id: string, body: ProjectInput) => api.put<Project>(`/projects/${id}`, body),
  remove: (id: string) => api.delete(`/projects/${id}`),
}

export const memberApi = {
  getAll: () => api.get<Member[]>('/members'),
  create: (body: {
    name: string
    username: string
    password: string
    role: import('../types').MemberRole
  }) => api.post<Member>('/members', body),
  update: (
    id: string,
    body: {
      name: string
      username: string
      password?: string
      role: import('../types').MemberRole
    },
  ) => api.put<Member>(`/members/${id}`, body),
  remove: (id: string) => api.delete(`/members/${id}`),
}

export const scheduleApi = {
  getAll: (projectId: string) => api.get<ScheduleTask[]>(withProject('/schedule', projectId)),
  create: (body: ScheduleTaskInput) => api.post<ScheduleTask>('/schedule', body),
  update: (id: string, body: ScheduleTaskInput) => api.put<ScheduleTask>(`/schedule/${id}`, body),
  remove: (id: string) => api.delete(`/schedule/${id}`),
}

export const bugApi = {
  getAll: (projectId: string, phase?: BugPhase | 'ALL') =>
    api.get<Bug[]>(
      phase && phase !== 'ALL'
        ? withProject('/bugs', projectId, `phase=${phase}`)
        : withProject('/bugs', projectId),
    ),
  create: (body: BugInput) => api.post<Bug>('/bugs', body),
  update: (id: string, body: BugInput) => api.put<Bug>(`/bugs/${id}`, body),
  remove: (id: string) => api.delete(`/bugs/${id}`),
}

export const structureApi = {
  getTree: (projectId: string) => api.get<StructureNode[]>(withProject('/structure', projectId)),
  create: (body: StructureNodeInput) => api.post<StructureNode>('/structure', body),
  remove: (id: string) => api.delete(`/structure/${id}`),
}

export const meetingApi = {
  getAll: (projectId: string) => api.get<Meeting[]>(withProject('/meetings', projectId)),
  create: (body: MeetingInput) => api.post<Meeting>('/meetings', body),
  update: (id: string, body: MeetingInput) => api.put<Meeting>(`/meetings/${id}`, body),
  toggleAction: (meetingId: string, actionId: string) =>
    api.patch<Meeting>(`/meetings/${meetingId}/action-items/${actionId}/toggle`),
  remove: (id: string) => api.delete(`/meetings/${id}`),
}
