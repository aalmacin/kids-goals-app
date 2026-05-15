# Research: Fix Inconsistent Reversal

## Reversal Strategy — Already Implemented

The existing `undoEndDay` implementation uses compensating activity_log entries (opposite sign). This is correct for the event-sourcing model. The `recalculate_kid_points` trigger handles point recalculation automatically. Apply the same pattern for undo rest day.

## Action Types — Mostly Existing

Most reversal action types already exist in the DB constraint (via migrations 0010-0014):
- `day_undone`, `penalty_reversed`, `effort_reversed`, `chore_completion_reward_reversed`, `task_completion_reversed`

**Only `rest_day_reversed` needs to be added** for the new undo rest day flow.

## Undo Count Storage

**Decision**: Add integer columns:
- `day_records.undo_end_count` (default 0)
- `day_records.undo_rest_day_count` (default 0)
- `chore_completions.uncheck_count` (default 0)

**Rationale**: Simple integer counters. The existing `undoEndDay` action works — just needs guard check and increment.

## Current-Day Restriction for Undo End Day

**Decision**: Add date check in `undoEndDay` comparing `day_records.date` against today (family timezone via `todayInTimezone`).

**Rationale**: Existing implementation has no date restriction. Server-side check prevents retroactive manipulation. Family timezone helper already exists in `lib/chore-schedule.ts`.

## Undo Rest Day Implementation

**Decision**: New `undoRestDay` server action following the `undoEndDay` pattern:
1. Check `undo_rest_day_count == 0` and `date == today`
2. Set `is_rest_day = false`, increment `undo_rest_day_count`
3. Insert `rest_day_reversed` activity_log entry with `points_delta: +100`

**Rationale**: Consistent with existing reversal pattern. The +100 triggers `recalculate_kid_points` automatically.

## Chore Uncheck Limit

**Decision**: Modify `toggleChore` to enforce uncheck limit:
1. When unchecking (completed -> incomplete), check `uncheck_count == 0`
2. If `uncheck_count > 0`, reject
3. On successful uncheck, increment `uncheck_count`

**Rationale**: The count is per-completion per-day (tied to `chore_completions` row). No impact on checking a chore.

## Effort Level Clearing — Already Implemented

The existing `undoEndDay` already sets `effort_level_id: null` when clearing `ended_at`. No additional work needed.

## Button Styling

**Decision**: Enlarge UndoEndDayButton and new UndoRestDayButton to match EndDayButton/RestDayButton sizing (rounded-xl, larger padding, bold font).

**Rationale**: FR-014 requires kid-friendly prominent buttons. Current UndoEndDayButton uses `text-sm` — inconsistent with other action buttons.
