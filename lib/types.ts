export type Kid = {
  id: string
  familyId: string
  supabaseUserId: string
  name: string
  birthday: string
  points: number
}

export type Chore = {
  id: string
  familyId: string
  name: string
  penalty: number
  reward: number
  isImportant: boolean
  icon: string
  deletedAt: string | null
  allowedDays: number[]
}

export type Family = {
  id: string
  name: string
  parentId: string
  timezone: string
  createdAt: string
}

export type ChoreAssignment = {
  id: string
  choreId: string
  kidId: string
  chore: Chore
}

export type ChoreCompletion = {
  id: string
  dayRecordId: string
  choreAssignmentId: string
  choreNameSnapshot: string
  penaltySnapshot: number
  isImportantSnapshot: boolean
  rewardSnapshot: number
  completedAt: string | null
  uncheckCount: number
}

export type DayRecord = {
  id: string
  kidId: string
  date: string
  isRestDay: boolean
  effortLevelId: string | null
  endedAt: string | null
  undoEndCount: number
  undoRestDayCount: number
  choreCompletions: ChoreCompletion[]
}

export type Reward = {
  id: string
  familyId: string
  name: string
  pointsCost: number
  icon: string
  deletedAt: string | null
}

export type EffortLevel = {
  id: string
  familyId: string
  name: string
  points: number
}

export type Task = {
  id: string
  familyId: string
  name: string
  points: number
  taskType: 'one_time' | 'repeated'
  maxCompletions: number | null
  oncePerDay: boolean
  deletedAt: string | null
}

export type TaskWithCounts = Task & {
  todayCount: number
  remaining: number | null
  completedForNow: boolean
}

export type TaskCompletion = {
  id: string
  taskId: string
  kidId: string
  taskNameSnapshot: string
  pointsSnapshot: number
  completedAt: string
}

export type ActivityLogEntry = {
  id: string
  familyId: string
  kidId: string | null
  actorType: 'parent' | 'kid'
  actionType:
    | 'chore_completed'
    | 'chore_unchecked'
    | 'rest_day_purchased'
    | 'reward_redeemed'
    | 'day_ended'
    | 'penalty_applied'
    | 'effort_awarded'
    | 'chore_assigned'
    | 'chore_unassigned'
    | 'manual_adjustment'
    | 'chore_completion_reward'
    | 'chore_completion_reward_reversed'
    | 'task_completed'
    | 'task_completion_reversed'
    | 'day_undone'
    | 'penalty_reversed'
    | 'effort_reversed'
    | 'rest_day_reversed'
  metadata: Record<string, unknown>
  pointsDelta: number | null
  createdAt: string
}

export type UserRole = 'parent' | 'kid'

export type SessionUser =
  | { role: 'parent'; userId: string; familyId: string }
  | { role: 'kid'; userId: string; kidId: string; familyId: string }
