import type { MemberRole } from '../types'

const TOKEN_KEY = 'pm_token'
const USER_KEY = 'pm_user'

export interface AuthUser {
  id: string
  name: string
  username: string
  role: MemberRole
  token: string
}

export function saveAuth(user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, user.token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function canWriteSchedule(role?: MemberRole) {
  return role === 'LEADER' || role === 'DEVELOPER'
}

/** Only leader creates new schedule assignments. */
export function canCreateSchedule(role?: MemberRole) {
  return role === 'LEADER'
}

export function canWriteBugs(role?: MemberRole) {
  return role === 'LEADER' || role === 'DEVELOPER' || role === 'QA'
}

export function canDeleteBugs(role?: MemberRole) {
  return role === 'LEADER' || role === 'QA'
}

export function canWriteMeetings(role?: MemberRole) {
  return role === 'LEADER' || role === 'DEVELOPER'
}

export function canManageStructure(role?: MemberRole) {
  return role === 'LEADER'
}

export function canManageMembers(role?: MemberRole) {
  return role === 'LEADER'
}

export function isLeader(role?: MemberRole) {
  return role === 'LEADER'
}
