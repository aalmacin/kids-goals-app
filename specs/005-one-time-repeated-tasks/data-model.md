# Data Model: One-Time and Repeated Tasks

## New Tables

### `tasks`

Family-owned task library. Parents create tasks; kids complete them.

| Column           | Type                          | Constraints                         | Notes                                      |
|------------------|-------------------------------|-------------------------------------|--------------------------------------------|
| `id`             | uuid                          | PK, default gen_random_uuid()       |                                            |
| `family_id`      | uuid                          | NOT NULL, FK → families.id          |                                            |
| `name`           | text                          | NOT NULL                            |                                            |
| `points`         | integer                       | NOT NULL, CHECK (points > 0)        | Points awarded per completion              |
| `task_type`      | text                          | NOT NULL, CHECK IN ('one_time','repeated') |                                     |
| `max_completions`| integer                       | NULL = unlimited                    | Only meaningful for `repeated` type        |
| `deleted_at`     | timestamptz                   | NULL                                | Soft delete                                |
| `created_at`     | timestamptz                   | NOT NULL, default now()             |                                            |

**Validation rules**:
- `max_completions` MUST be NULL or > 0 (CHECK constraint: `max_completions IS NULL OR max_completions > 0`)
- `task_type = 'one_time'` → `max_completions` is ignored (effectively always 1)

---

### `task_completions`

Per-kid completion records. Each row = one successful completion.

| Column               | Type        | Constraints                            | Notes                                    |
|----------------------|-------------|----------------------------------------|------------------------------------------|
| `id`                 | uuid        | PK, default gen_random_uuid()          |                                          |
| `task_id`            | uuid        | NOT NULL, FK → tasks.id                |                                          |
| `kid_id`             | uuid        | NOT NULL, FK → kids.id                 |                                          |
| `task_name_snapshot` | text        | NOT NULL                               | Name at time of completion               |
| `points_snapshot`    | integer     | NOT NULL                               | Points at time of completion             |
| `completed_at`       | timestamptz | NOT NULL, default now()                |                                          |

**Unique constraint**: `UNIQUE (task_id, kid_id) WHERE tasks.task_type = 'one_time'` — implemented as a partial unique index in the migration.

---

## Modified Tables

### `activity_log.action_type`

Add `'task_completed'` to the CHECK constraint.

```sql
ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment',
    'task_completed'
  ));
```

---

## TypeScript Type Updates

### `lib/types.ts`

```typescript
export type Task = {
  id: string
  familyId: string
  name: string
  points: number
  taskType: 'one_time' | 'repeated'
  maxCompletions: number | null
  deletedAt: string | null
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

`ActivityLogEntry.actionType` union — add `'task_completed'`.

### `lib/database.types.ts`

Add `tasks` and `task_completions` table definitions. Add `'task_completed'` to `activity_log` action_type union.

---

## RLS Policies

### `tasks`

- Parent: ALL on tasks where `family_id` belongs to parent's family
- Kid: SELECT on non-deleted tasks where `family_id` = kid's family_id

### `task_completions`

- Parent: SELECT on completions for kids in their family
- Kid: SELECT + INSERT on their own completions (`kid_id = auth kid id`)

---

## State Transitions

### One-Time Task

```
available → [kid confirms] → completed (permanent)
                ↓ cancel
            available (unchanged)
```

### Repeated Task (unlimited)

```
available → [kid clicks] → points awarded → available again (no state change)
```

### Repeated Task (with limit N)

```
available → [kid clicks] → completion #n recorded → available (if n < N) OR unavailable (if n == N)
```
