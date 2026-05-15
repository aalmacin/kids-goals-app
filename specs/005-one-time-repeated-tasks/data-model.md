# Data Model: One-Time and Repeated Tasks

## Tables (migration 0013 — already applied)

### `tasks`

| Column           | Type                                    | Constraints                              | Notes                                      |
|------------------|-----------------------------------------|------------------------------------------|--------------------------------------------|
| `id`             | uuid                                    | PK, default gen_random_uuid()            |                                            |
| `family_id`      | uuid                                    | NOT NULL, FK → families.id ON DELETE CASCADE |                                        |
| `name`           | text                                    | NOT NULL                                 |                                            |
| `points`         | integer                                 | NOT NULL, CHECK (points > 0)             |                                            |
| `task_type`      | text                                    | NOT NULL, CHECK IN ('one_time','repeated') |                                          |
| `max_completions`| integer                                 | NULL = unlimited                         | Only meaningful for `repeated` type        |
| `deleted_at`     | timestamptz                             | NULL                                     | Soft delete                                |
| `created_at`     | timestamptz                             | NOT NULL, default now()                  |                                            |

### `task_completions`

| Column               | Type        | Constraints                            | Notes                          |
|----------------------|-------------|----------------------------------------|--------------------------------|
| `id`                 | uuid        | PK, default gen_random_uuid()          |                                |
| `task_id`            | uuid        | NOT NULL, FK → tasks.id ON DELETE CASCADE |                             |
| `kid_id`             | uuid        | NOT NULL, FK → kids.id ON DELETE CASCADE  |                             |
| `task_name_snapshot` | text        | NOT NULL                               | Name at time of completion     |
| `points_snapshot`    | integer     | NOT NULL                               | Points at time of completion   |
| `completed_at`       | timestamptz | NOT NULL, default now()                |                                |

---

## Schema Extensions (migration 0014 — NEW)

### `tasks.once_per_day`

```sql
ALTER TABLE tasks ADD COLUMN once_per_day boolean NOT NULL DEFAULT false;
```

| Column        | Type    | Constraints              | Notes                                                   |
|---------------|---------|--------------------------|----------------------------------------------------------|
| `once_per_day`| boolean | NOT NULL, DEFAULT false  | When true on a `repeated` task, capped to 1 per calendar day |

**Validation**: Meaningful only when `task_type = 'repeated'`. Stored but ignored for `one_time` tasks.

### `activity_log.action_type` — add `task_completion_reversed`

```sql
ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment',
    'day_undone', 'penalty_reversed', 'effort_reversed',
    'chore_completion_reward', 'chore_completion_reward_reversed',
    'task_completed', 'task_completion_reversed'
  ));
```

### `task_completions` — DELETE RLS policy for kids

```sql
CREATE POLICY "kid_delete_own_task_completions" ON task_completions
  FOR DELETE USING (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );
```

---

## TypeScript Types

### `lib/types.ts`

```typescript
export type Task = {
  id: string
  familyId: string
  name: string
  points: number
  taskType: 'one_time' | 'repeated'
  maxCompletions: number | null
  oncePerDay: boolean           // NEW
  deletedAt: string | null
}

// NEW: returned by getAvailableTasksForKid
export type TaskWithCounts = Task & {
  todayCount: number            // completions for this kid+task today (family timezone)
}

export type TaskCompletion = {
  id: string
  taskId: string
  kidId: string
  taskNameSnapshot: string
  pointsSnapshot: number
  completedAt: string
}
```

`ActivityLogEntry.actionType` union — add `'task_completion_reversed'`.

---

## RLS Policies Summary

### `tasks`

| Policy | Role | Operation |
|--------|------|-----------|
| `parent_all_tasks` | parent | ALL (family_id check) |
| `kid_select_tasks` | kid | SELECT (non-deleted, family_id check) |

### `task_completions`

| Policy | Role | Operation |
|--------|------|-----------|
| `parent_select_task_completions` | parent | SELECT (family check via kids join) |
| `kid_select_own_task_completions` | kid | SELECT (own kid_id) |
| `kid_insert_own_task_completions` | kid | INSERT (own kid_id) |
| `kid_delete_own_task_completions` | kid | DELETE (own kid_id) — NEW |

---

## Edit Constraints

Tasks support limited editing after creation:

| Field | Editable | Reason |
|-------|----------|--------|
| `name` | Yes | No downstream impact (snapshots preserve original) |
| `points` | Yes | No downstream impact (snapshots preserve original) |
| `task_type` | No | Changing type breaks completion invariants |
| `once_per_day` | No | Changing daily limits mid-stream creates inconsistencies |
| `max_completions` | No | Changing limits could invalidate existing completion counts |

No new migration required — the existing `parent_all_tasks` RLS policy uses `FOR ALL` which covers UPDATE.

## State Transitions

### One-Time Task

```
available → [kid clicks → confirmation dialog → confirms] → completed (permanent)
                                               ↓ cancels
                                           available (unchanged)
```

### Repeated Task (unlimited, not once_per_day)

```
available → [kid clicks] → todayCount+1, points awarded → available again
          ← [kid undoes (todayCount > 0)] → todayCount-1, points deducted
```

### Repeated Task (once_per_day)

```
available → [kid clicks] → todayCount = 1, points awarded → unavailable for rest of day
next day → available again (todayCount resets to 0)
```

### Repeated Task (max_completions = N)

```
available → [kid clicks] → totalCount+1 → available if totalCount < N, unavailable if totalCount == N
```
