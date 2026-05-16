# Research: Fix Inconsistent Reversal

## Reversal Strategy

The existing event-sourcing model handles points recalculation via the `recalculate_kid_points` trigger on `activity_log`. All reversal entries (uncheck-related) insert compensating activity_log rows and the trigger handles the rest automatically.

## Undo End Day / Undo Rest Day — Removed

These features were removed on 2026-05-16. End Day is now a permanent terminal action. If a kid forgets to end the day, they can return via the Calendar page. The `undo_end_count` and `undo_rest_day_count` columns remain in the DB schema but are no longer used by application logic.

## Effort Levels — Removed

The Effort Levels feature (admin management of effort levels, kid selection at End Day, `effort_awarded` activity log entries) was removed on 2026-05-16. The `effort_levels` table and `effort_level_id` on `day_records` remain in the DB but are no longer used.

## Chore Uncheck Limit

**Decision**: Modify `toggleChore` to enforce uncheck limit:
1. When unchecking (completed -> incomplete), check `uncheck_count == 0`
2. If `uncheck_count > 0`, reject
3. On successful uncheck, increment `uncheck_count`

**Rationale**: The count is per-completion per-day (tied to `chore_completions` row). No impact on checking a chore.

## Task Lock After End Day

**Decision**: Two-layer enforcement:
1. `TaskSection` component returns `null` when `isEnded` prop is true — hides the section entirely
2. `completeTaskAction` checks today's `day_records.ended_at` server-side and throws if ended

**Rationale**: Defense in depth. UI hides the section; server-side guard blocks direct calls.
