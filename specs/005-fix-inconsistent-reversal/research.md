# Research: Fix Inconsistent Reversal

## Reversal Strategy for Event-Sourced Points

**Decision**: Insert compensating activity_log entries (opposite sign) rather than deleting original entries.

**Rationale**: The `recalculate_kid_points` trigger sums all `points_delta` for a kid. Inserting a compensating entry (e.g., `+penalty` to reverse a `-penalty`) maintains full audit trail and triggers automatic recalculation. Deleting entries would lose audit history and require manual point recalculation.

**Alternatives considered**:
- Delete original entries: Loses audit trail, breaks event-sourcing principle.
- Soft-delete with a flag: Adds complexity; trigger would need modification. Not worth it.

## New Activity Log Action Types

**Decision**: Add three new action types: `end_day_reversed`, `rest_day_reversed`, `effort_reversed`.

**Rationale**: Distinct action types make the activity log readable and filterable. Using generic "reversal" type would lose context about what was reversed.

**Alternatives considered**:
- Reuse existing types with negative deltas: Ambiguous — a `penalty_applied` with positive delta looks like a reward, not a reversal.
- Single `reversal` type with metadata: Less queryable, harder to display in activity log UI.

## Undo Count Storage

**Decision**: Add integer columns `undo_end_count` on `day_records` and `uncheck_count` on `chore_completions`, defaulting to 0.

**Rationale**: Simple integer columns are the minimal change needed. Boolean would work for the current "once" requirement, but integer is more flexible if the limit changes later, and equally simple to implement.

**Alternatives considered**:
- Boolean `has_been_undone`: Works but less flexible. Same storage cost.
- Separate undo_history table: Over-engineered for a simple counter.

## Effort Level Clearing on Undo

**Decision**: Set `effort_level_id` to NULL on the `day_records` row when end-day is undone.

**Rationale**: The effort level selection is part of the end-day action. Clearing it ensures the kid selects fresh when re-ending, which is the desired behavior per clarification.

## Action Type Constraint Update

**Decision**: A new migration will ALTER the `activity_log_action_type_check` constraint to include the three new action types.

**Rationale**: The existing CHECK constraint on `action_type` must be updated or inserts will fail. This follows the same pattern used in migration `0006_event_sourcing.sql`.
