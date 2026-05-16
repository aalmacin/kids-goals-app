# Research: Fix Inconsistent Reversal

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

## Undo End Day / Undo Rest Day — Removed

These features were removed on 2026-05-16. End Day is a permanent terminal action. The `undo_end_count` and `undo_rest_day_count` columns remain in the DB schema but are no longer used by application logic.

## Effort Levels — Removed

The Effort Levels feature was removed on 2026-05-16. The `effort_levels` table and `effort_level_id` on `day_records` remain in the DB but are no longer used.

## End Day Atomicity

**Problem**: `endDay` performs 4–6 sequential DB writes with no rollback. A partial failure (network blip, constraint violation on the 3rd insert) leaves the day record in an inconsistent state — e.g., `penalty_applied` logged but `ended_at` never set.

**Decision**: Wrap all `endDay` writes in a PostgreSQL function (`end_day(p_day_record_id uuid)`), called via `supabase.rpc()`.

**Rationale**: Supabase's JavaScript client has no multi-statement transaction API. A PL/pgSQL function is the only supported path to atomicity. PostgreSQL wraps the function body in an implicit transaction — if any statement raises an exception, all writes roll back automatically. This matches the existing project pattern (`apply_points_delta` is also a SECURITY DEFINER plpgsql function).

**Alternatives considered**:
- *Application-level compensation* (insert reversal rows on failure): rejected — adds complexity and still leaves a window of inconsistency during the error path.
- *Supabase Edge Function*: rejected — Constitution Principle II prohibits Edge Functions unless a server action cannot satisfy the requirement. An RPC function satisfies it.

**Function design**:
- `SECURITY DEFINER` — follows existing project pattern; function validates caller ownership of `day_record_id` via `auth.uid()` internally
- Takes only `p_day_record_id uuid` — derives kid_id, family_id, completions from the DB internally
- Penalty and reward calculations re-implemented in SQL (simple SUM/filter queries matching the TypeScript logic)
- Returns `jsonb` — `{ success: true }` or raises an exception on error
- TypeScript caller: validates auth, calls `supabase.rpc('end_day', { p_day_record_id })`, handles exception

**Security**: The function checks `kid_id` against `auth.uid()` via `kids.supabase_user_id`. If the caller does not own the day record, the function raises an exception.
