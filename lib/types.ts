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
  isImportant: boolean
  icon: string
  deletedAt: string | null
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
  completedAt: string | null
}

export type DayRecord = {
  id: string
  kidId: string
  date: string
  isRestDay: boolean
  effortLevelId: string | null
  endedAt: string | null
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
  metadata: Record<string, unknown>
  pointsDelta: number | null
  createdAt: string
}

export type UserRole = 'parent' | 'kid'

export type SessionUser =
  | { role: 'parent'; userId: string; familyId: string }
  | { role: 'kid'; userId: string; kidId: string; familyId: string }
