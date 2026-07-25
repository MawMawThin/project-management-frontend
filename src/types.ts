export type MemberRole = 'LEADER' | 'DEVELOPER' | 'QA'
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'CLOSED' | 'REOPENED'
export type BugPhase = 'PHASE_1' | 'PHASE_2' | 'DEV' | 'SYSTEM_ADMIN'
export type StructureNodeType = 'MODULE' | 'FEATURE' | 'PAGE' | 'API'
export type StructureStatus = 'PLANNED' | 'BUILDING' | 'DONE'

export interface Member {
  id: string
  name: string
  username?: string
  role: MemberRole
}

export interface DashboardSummary {
  activeTasks: number
  openBugs: number
  modules: number
  openActionItems: number
}

export interface ScheduleTask {
  id: string
  title: string
  description: string
  assignedBy: Member
  assignedTo: Member
  startDate: string
  dueDate: string
  priority: PriorityLevel
  status: TaskStatus
}

export interface ScheduleTaskInput {
  title: string
  description: string
  assignedById: string
  assignedToId: string
  startDate: string
  dueDate: string
  priority: PriorityLevel
  status: TaskStatus
}

export interface Bug {
  id: string
  name: string
  detail: string
  level: PriorityLevel
  status: BugStatus
  phase: BugPhase
  createdAt: string
  assignees: Member[]
}

export interface BugInput {
  name: string
  detail: string
  level: PriorityLevel
  status: BugStatus
  phase: BugPhase
  assigneeIds: string[]
}

export interface StructureNode {
  id: string
  name: string
  type: StructureNodeType
  description?: string
  owner?: Member | null
  status?: StructureStatus | null
  children: StructureNode[]
}

export interface StructureNodeInput {
  name: string
  type: StructureNodeType
  description?: string
  ownerId?: string
  status?: StructureStatus
  parentId?: string | null
}

export interface ActionItem {
  id: string
  text: string
  owner: Member
  dueDate: string
  done: boolean
}

export interface Meeting {
  id: string
  title: string
  date: string
  agenda: string
  notes: string
  attendees: Member[]
  actionItems: ActionItem[]
}

export interface ActionItemInput {
  id?: string
  text: string
  ownerId: string
  dueDate: string
  done: boolean
}

export interface MeetingInput {
  title: string
  date: string
  agenda: string
  notes: string
  attendeeIds: string[]
  actionItems: ActionItemInput[]
}
