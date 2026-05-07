# Data Model: Chore Completion Reward Points

## Updated Entities

### chores (updated)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | uuid | PK | unchanged |
| family_id | uuid | FK families | unchanged |
| name | text | NOT NULL | unchanged |
| penalty | integer | NOT NULL, DEFAULT 0, ≥ 0 | unchanged |
| **reward_points** | integer | NOT NULL, DEFAULT 0, ≥ 0 | **new** |
| is_important | boolean | NOT NULL, DEFAULT false | unchanged |
| icon | text | NOT NULL | unchanged |
| deleted_at | timestamptz | nullable | unchanged |
| created_at | timestamptz | NOT NULL, DEFAULT now() | unchanged |

### chore_completions (updated)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | uuid | PK | unchanged |
| day_record_id | uuid | FK day_records | unchanged |
| chore_assignment_id | uuid | FK chore_assignments | unchanged |
| chore_name_snapshot | text | NOT NULL | unchanged |
| penalty_snapshot | integer | NOT NULL | unchanged |
| is_important_snapshot | boolean | NOT NULL | unchanged |
| **reward_snapshot** | integer | NOT NULL, DEFAULT 0, ≥ 0 | **new** — snapshot of reward_points at day-record creation |
| completed_at | timestamptz | nullable | unchanged |

### activity_log (updated constraint only)

One new `action_type` value added to the CHECK constraint:

| action_type | actor | points_delta | When inserted | Description |
|-------------|-------|-------------|---------------|-------------|
| `chore_completion_reward` | kid | +N (reward_snapshot) | End Day | Kid earned reward for completing a chore |

No `chore_completion_reward_reversed` event — unchecking before End Day means no reward was ever granted, so no reversal is needed.

All other event types unchanged.

## TypeScript Type Changes

### Chore (lib/types.ts)
```typescript
export type Chore = {
  id: string
  familyId: string
  name: string
  penalty: number
  reward: number          // new — maps to reward_points column
  isImportant: boolean
  icon: string
  deletedAt: string | null
}
```

### ChoreCompletion (lib/types.ts)
```typescript
export type ChoreCompletion = {
  id: string
  dayRecordId: string
  choreAssignmentId: string
  choreNameSnapshot: string
  penaltySnapshot: number
  isImportantSnapshot: boolean
  rewardSnapshot: number    // new — maps to reward_snapshot column
  completedAt: string | null
}
```

### ActivityLogEntry.actionType (lib/types.ts)
```typescript
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
  | 'chore_completion_reward'   // new
```

## Migration

**File**: `supabase/migrations/0007_chore_reward_points.sql`

```sql
-- Add reward_points to chores library
ALTER TABLE chores
  ADD COLUMN reward_points integer NOT NULL DEFAULT 0 CHECK (reward_points >= 0);

-- Add reward snapshot to chore_completions
ALTER TABLE chore_completions
  ADD COLUMN reward_snapshot integer NOT NULL DEFAULT 0 CHECK (reward_snapshot >= 0);

-- Extend activity_log action_type constraint
ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment',
    'chore_completion_reward'
  ));
```

## State Transitions

### End Day Flow (updated)

```
endDay(dayRecordId, effortLevelId?):
  1. Verify day not already ended
  2. Fetch completions for the day
  3. Calculate total penalty (existing: calculatePenalties)
  4. IF totalPenalty > 0: INSERT activity_log (penalty_applied, -totalPenalty)
  5. For each completion where completed_at IS NOT NULL AND reward_snapshot > 0:
       INSERT activity_log (chore_completion_reward, +reward_snapshot,
         metadata: { chore_name: chore_name_snapshot, completion_id: id })
       → trigger recalculates kids.points after each insert
  6. IF effortLevelId: INSERT activity_log (effort_awarded, +effortPoints)
  7. Mark day ended: UPDATE day_records SET ended_at = now()
  8. INSERT activity_log (day_ended, points_delta: null)
```

### Day Record Creation (reward snapshot seeding)

```
getOrCreateDayRecord → new day:
  - Fetch chore with id, name, penalty, is_important, reward_points, deleted_at
  - Insert chore_completion with:
      chore_name_snapshot = chore.name
      penalty_snapshot    = chore.penalty
      reward_snapshot     = chore.reward_points   ← new
      is_important_snapshot = chore.is_important
  - reward_snapshot is frozen; subsequent edits to library chore do not affect it
```

### Toggle Flow (unchanged from today)

```
toggleChore(completionId, completed, dayRecordId):
  - Verify day not ended
  - UPDATE chore_completions SET completed_at = now() | null
  - INSERT activity_log (chore_completed | chore_unchecked, points_delta: null)
  - No reward event inserted here
```
