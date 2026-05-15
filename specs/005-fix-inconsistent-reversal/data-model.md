# Data Model: Fix Inconsistent Reversal

## Schema Changes (migration 0015)

### day_records (add columns)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| undo_end_count | integer NOT NULL | 0 | Times end-day has been undone (max 1) |
| undo_rest_day_count | integer NOT NULL | 0 | Times rest-day has been undone (max 1) |

**Constraints**: `CHECK (undo_end_count >= 0)`, `CHECK (undo_rest_day_count >= 0)`

### chore_completions (add column)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| uncheck_count | integer NOT NULL | 0 | Times this chore has been unchecked (max 1) |

**Constraints**: `CHECK (uncheck_count >= 0)`

### activity_log (update constraint)

Add `rest_day_reversed` to the existing `action_type` CHECK. All other reversal types already exist:
- `day_undone` (exists)
- `penalty_reversed` (exists)
- `effort_reversed` (exists)
- `chore_completion_reward_reversed` (exists)
- `rest_day_reversed` (NEW)

## Existing Schema Context

Current action types in constraint (from migration 0014):
`chore_completed`, `chore_unchecked`, `rest_day_purchased`, `reward_redeemed`, `day_ended`, `penalty_applied`, `effort_awarded`, `chore_assigned`, `chore_unassigned`, `manual_adjustment`, `day_undone`, `penalty_reversed`, `effort_reversed`, `chore_completion_reward`, `chore_completion_reward_reversed`, `task_completed`, `task_completion_reversed`

## State Transitions

### Day Record Lifecycle

```
Created -> [chores toggleable]
  | End Day
Ended (ended_at set, penalties/effort/chore rewards applied)
  | Undo End Day (if undo_end_count == 0 AND date == today)
Created (ended_at cleared, effort_level_id cleared, undo_end_count = 1, compensating log entries)
  | End Day (again)
Ended (fresh penalties/effort/chore rewards)
  [No more undos - undo_end_count == 1]
```

### Rest Day Lifecycle

```
Normal Day -> Declare Rest Day (is_rest_day = true, -100 pts logged)
  | Undo Rest Day (if undo_rest_day_count == 0 AND date == today)
Normal Day (is_rest_day = false, undo_rest_day_count = 1, +100 pts compensating entry)
  [No more rest day undos]
```

### Chore Completion Lifecycle

```
Incomplete (completed_at = null, uncheck_count = 0)
  | Complete
Completed (completed_at set)
  | Uncheck (if uncheck_count == 0 AND day not ended)
Incomplete (completed_at = null, uncheck_count = 1)
  | Complete (again)
Completed + Locked (completed_at set, uncheck_count = 1, checkbox disabled for unchecking)
```

## Undo Eligibility Rules

| Action | Eligible When |
|--------|---------------|
| Undo End Day | `ended_at IS NOT NULL` AND `undo_end_count == 0` AND `date == today` |
| Undo Rest Day | `is_rest_day == true` AND `undo_rest_day_count == 0` AND `date == today` |
| Uncheck Chore | `completed_at IS NOT NULL` AND `uncheck_count == 0` AND day not ended |
