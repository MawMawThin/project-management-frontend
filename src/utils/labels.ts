import type { BugPhase, PriorityLevel, TaskStatus, BugStatus, StructureStatus, MemberRole } from '../types'

const priorityMap: Record<PriorityLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

const taskStatusMap: Record<TaskStatus, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
}

const bugStatusMap: Record<BugStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  FIXED: 'Fixed',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
}

const phaseMap: Record<BugPhase, string> = {
  PHASE_1: 'Phase 1',
  PHASE_2: 'Phase 2',
  DEV: 'Dev',
  SYSTEM_ADMIN: 'System Admin',
}

const structureStatusMap: Record<StructureStatus, string> = {
  PLANNED: 'Planned',
  BUILDING: 'Building',
  DONE: 'Done',
}

const roleMap: Record<MemberRole, string> = {
  LEADER: 'Leader',
  DEVELOPER: 'Developer',
  QA: 'QA',
}

export function labelPriority(v: PriorityLevel) {
  return priorityMap[v]
}

export function labelTaskStatus(v: TaskStatus) {
  return taskStatusMap[v]
}

export function labelBugStatus(v: BugStatus) {
  return bugStatusMap[v]
}

export function labelPhase(v: BugPhase) {
  return phaseMap[v]
}

export function labelStructureStatus(v: StructureStatus) {
  return structureStatusMap[v]
}

export function labelRole(v: MemberRole) {
  return roleMap[v]
}

export function pillClassFromLabel(label: string) {
  return label.toLowerCase().replace(/\s+/g, '-')
}
