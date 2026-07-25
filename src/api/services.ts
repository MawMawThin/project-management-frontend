import { api } from './client'
import type {
  Bug,
  BugInput,
  BugPhase,
  DashboardSummary,
  Meeting,
  MeetingInput,
  Member,
  ScheduleTask,
  ScheduleTaskInput,
  StructureNode,
  StructureNodeInput,
} from '../types'

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard'),
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
  getAll: () => api.get<ScheduleTask[]>('/schedule'),
  create: (body: ScheduleTaskInput) => api.post<ScheduleTask>('/schedule', body),
  update: (id: string, body: ScheduleTaskInput) => api.put<ScheduleTask>(`/schedule/${id}`, body),
  remove: (id: string) => api.delete(`/schedule/${id}`),
}

export const bugApi = {
  getAll: (phase?: BugPhase | 'ALL') =>
    api.get<Bug[]>(phase && phase !== 'ALL' ? `/bugs?phase=${phase}` : '/bugs'),
  create: (body: BugInput) => api.post<Bug>('/bugs', body),
  update: (id: string, body: BugInput) => api.put<Bug>(`/bugs/${id}`, body),
  remove: (id: string) => api.delete(`/bugs/${id}`),
}

export const structureApi = {
  getTree: () => api.get<StructureNode[]>('/structure'),
  create: (body: StructureNodeInput) => api.post<StructureNode>('/structure', body),
  remove: (id: string) => api.delete(`/structure/${id}`),
}

export const meetingApi = {
  getAll: () => api.get<Meeting[]>('/meetings'),
  create: (body: MeetingInput) => api.post<Meeting>('/meetings', body),
  update: (id: string, body: MeetingInput) => api.put<Meeting>(`/meetings/${id}`, body),
  toggleAction: (meetingId: string, actionId: string) =>
    api.patch<Meeting>(`/meetings/${meetingId}/action-items/${actionId}/toggle`),
  remove: (id: string) => api.delete(`/meetings/${id}`),
}
