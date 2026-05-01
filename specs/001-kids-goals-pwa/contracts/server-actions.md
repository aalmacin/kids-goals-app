# Server Action Contracts

**Branch**: `001-kids-goals-pwa` | **Date**: 2026-04-25

These are the typed interfaces for all Server Actions. Each action runs with `'use server'` and verifies auth internally before accessing the database.

---

## Auth (`lib/actions/auth.ts`)

```ts
// Parent login via Supabase Auth email/password
loginParent(email: string, password: string): Promise<{ error?: string }>

// Kid login: resolves family+name+passcode → synthetic Supabase credentials
loginKid(familyName: string, kidName: string, passcode: string): Promise<{ error?: string }>

// Logout current session (parent or kid)
logout(): Promise<void>
```

---

## Kids (`lib/actions/kids.ts`)

```ts
// Add a new kid to the family (parent only)
addKid(input: {
  name: string        // unique within family
  birthday: string    // ISO date
  passcode: string    // 4–6 digit PIN
}): Promise<{ kidId: string } | { error: string }>

// Edit kid details (parent only)
updateKid(kidId: string, input: {
  name?: string
  birthday?: string
  passcode?: string
}): Promise<{ error?: string }>

// Remove kid from family (parent only)
removeKid(kidId: string): Promise<{ error?: string }>

// List all kids in the parent's family
getKids(): Promise<Kid[]>
```

---

## Chores (`lib/actions/chores.ts`)

```ts
// Create a chore in the family library (parent only)
createChore(input: {
  name: string
  penalty: number
  isImportant: boolean
  icon: string
}): Promise<{ choreId: string } | { error: string }>

// Update a chore in the library (parent only)
updateChore(choreId: string, input: Partial<{
  name: string
  penalty: number
  isImportant: boolean
  icon: string
}>): Promise<{ error?: string }>

// Soft-delete a chore from the library (parent only)
deleteChore(choreId: string): Promise<{ error?: string }>

// Assign a library chore to a specific kid (parent only)
assignChore(choreId: string, kidId: string): Promise<{ error?: string }>

// Remove a chore assignment from a kid (parent only)
unassignChore(choreId: string, kidId: string): Promise<{ error?: string }>

// Get full chore library for the family
getChoreLibrary(): Promise<Chore[]>

// Get chore assignments for a specific kid
getChoreAssignments(kidId: string): Promise<ChoreAssignment[]>
```

---

## Day Records (`lib/actions/day-records.ts`)

```ts
// Get or create the day record for a kid on a date
// Also seeds chore_completions rows if not yet created
getDayRecord(kidId: string, date: string): Promise<DayRecord>

// Toggle a chore completion on/off (kid or parent)
// No-op if day_record.ended_at is set
toggleChoreCompletion(
  choreCompletionId: string,
  completed: boolean
): Promise<{ error?: string }>

// Declare a rest day for the kid — deducts 100 points (kid or parent)
// Fails if points < 100 or rest day already active for that date
declareRestDay(kidId: string, date: string): Promise<{ error?: string }>

// End the day: apply penalties for incomplete chores, award effort points
// Idempotent — no-op if already ended
endDay(kidId: string, date: string, effortLevelId?: string): Promise<{
  penaltiesApplied: number
  pointsAwarded: number
  error?: string
}>
```

---

## Rewards (`lib/actions/rewards.ts`)

```ts
// Create a reward (parent only)
createReward(input: {
  name: string
  pointsCost: number
  icon: string
}): Promise<{ rewardId: string } | { error: string }>

// Update a reward (parent only)
updateReward(rewardId: string, input: Partial<{
  name: string
  pointsCost: number
  icon: string
}>): Promise<{ error?: string }>

// Soft-delete a reward (parent only)
deleteReward(rewardId: string): Promise<{ error?: string }>

// Redeem a reward (kid) — deducts points atomically
// Fails if kid's balance < reward.points_cost
redeemReward(rewardId: string): Promise<{ error?: string }>

// List available rewards for the family
getRewards(): Promise<Reward[]>
```

---

## Effort Levels (`lib/actions/effort-levels.ts`)

```ts
// Create an effort level (parent only)
createEffortLevel(input: {
  name: string
  points: number
}): Promise<{ effortLevelId: string } | { error: string }>

// Update an effort level (parent only)
updateEffortLevel(effortLevelId: string, input: Partial<{
  name: string
  points: number
}>): Promise<{ error?: string }>

// Delete an effort level (parent only)
deleteEffortLevel(effortLevelId: string): Promise<{ error?: string }>

// Get all effort levels for the family
getEffortLevels(): Promise<EffortLevel[]>
```

---

## Activity Log (`lib/actions/activity-log.ts`)

```ts
// Get paginated activity log for the family (parent or kid)
getActivityLog(input?: {
  kidId?: string     // filter by kid
  limit?: number     // default 50
  cursor?: string    // for pagination (created_at of last item)
}): Promise<ActivityLogEntry[]>
```

---

## Shared Types

```ts
type Kid = {
  id: string
  familyId: string
  name: string
  birthday: string
  points: number
}

type Chore = {
  id: string
  familyId: string
  name: string
  penalty: number
  isImportant: boolean
  icon: string
  deletedAt: string | null
}

type ChoreAssignment = {
  id: string
  choreId: string
  kidId: string
  chore: Chore
}

type DayRecord = {
  id: string
  kidId: string
  date: string
  isRestDay: boolean
  effortLevelId: string | null
  endedAt: string | null
  choreCompletions: ChoreCompletion[]
}

type ChoreCompletion = {
  id: string
  dayRecordId: string
  choreAssignmentId: string
  choreNameSnapshot: string
  penaltySnapshot: number
  isImportantSnapshot: boolean
  completedAt: string | null
}

type Reward = {
  id: string
  familyId: string
  name: string
  pointsCost: number
  icon: string
  deletedAt: string | null
}

type EffortLevel = {
  id: string
  familyId: string
  name: string
  points: number
}

type ActivityLogEntry = {
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
  metadata: Record<string, unknown>
  pointsDelta: number | null
  createdAt: string
}
```
