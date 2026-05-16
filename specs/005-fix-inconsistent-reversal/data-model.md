# Data Model: Fix Inconsistent Reversal

## Schema Changes (migration 0015)

### chore_completions (add column)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| uncheck_count | integer NOT NULL | 0 | Times this chore has been unchecked (max 1) |

**Constraints**: `CHECK (uncheck_count >= 0)`

### activity_log (update constraint)

Add `rest_day_reversed` to the existing `action_type` CHECK. All other reversal types already exist:
- `day_undone` (exists — historical, no longer produced)
- `penalty_reversed` (exists — historical, no longer produced)
- `effort_reversed` (exists — historical, no longer produced)
- `chore_completion_reward_reversed` (exists)
- `rest_day_reversed` (added in migration 0015 — historical, no longer produced)

> **Note**: `undo_end_count` and `undo_rest_day_count` were added to `day_records` in migration 0015 but are no longer used — Undo End Day and Undo Rest Day were removed. The columns remain in the schema.

## Existing Schema Context

Current action types in constraint (from migration 0015):
`chore_completed`, `chore_unchecked`, `rest_day_purchased`, `reward_redeemed`, `day_ended`, `penalty_applied`, `effort_awarded`, `chore_assigned`, `chore_unassigned`, `manual_adjustment`, `day_undone`, `penalty_reversed`, `effort_reversed`, `chore_completion_reward`, `chore_completion_reward_reversed`, `task_completed`, `task_completion_reversed`, `rest_day_reversed`

> **Note**: `effort_awarded` remains in the constraint for historical log entries; the Effort Levels feature has been removed.

## State Transitions

### Day Record Lifecycle

```
Created -> [chores toggleable, tasks visible]
  | End Day
Ended (ended_at set, penalties/chore rewards applied, tasks hidden)
  [Terminal — cannot be undone. Past days accessible via Calendar page.]
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
| Uncheck Chore | `completed_at IS NOT NULL` AND `uncheck_count == 0` AND day not ended |
