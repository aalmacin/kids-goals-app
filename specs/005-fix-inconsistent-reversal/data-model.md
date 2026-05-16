# Data Model: Fix Inconsistent Reversal

## Schema Changes (migration 0015)

### chore_completions (add column)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| uncheck_count | integer NOT NULL | 0 | Times this chore has been unchecked (max 1) |

**Constraints**: `CHECK (uncheck_count >= 0)`

### activity_log (update constraint)

Added `rest_day_reversed` to the `action_type` CHECK constraint.

> **Note**: `undo_end_count` and `undo_rest_day_count` were added to `day_records` in migration 0015 but are no longer used — Undo End Day and Undo Rest Day were removed. The columns remain in the schema.

## Schema Changes (migration 0016)

### New PostgreSQL function: `end_day`

```sql
CREATE OR REPLACE FUNCTION end_day(p_day_record_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kid_id   uuid;
  v_family_id uuid;
  v_is_rest_day boolean;
  v_ended_at timestamptz;
  v_total_penalty integer;
  v_rec record;
BEGIN
  -- Verify caller owns this day record
  SELECT dr.kid_id, dr.ended_at, dr.is_rest_day, k.family_id
    INTO v_kid_id, v_ended_at, v_is_rest_day, v_family_id
    FROM day_records dr
    JOIN kids k ON k.id = dr.kid_id
   WHERE dr.id = p_day_record_id
     AND k.supabase_user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Day record not found or not authorized';
  END IF;

  -- Idempotent: already ended
  IF v_ended_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true);
  END IF;

  -- Calculate and apply penalty
  SELECT COALESCE(SUM(penalty_snapshot), 0)
    INTO v_total_penalty
    FROM chore_completions
   WHERE day_record_id = p_day_record_id
     AND completed_at IS NULL
     AND (NOT v_is_rest_day OR is_important_snapshot = true);

  IF v_total_penalty > 0 THEN
    INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
    VALUES (v_family_id, v_kid_id, 'kid', 'penalty_applied',
            jsonb_build_object('day_record_id', p_day_record_id, 'total_penalty', v_total_penalty),
            -v_total_penalty);
  END IF;

  -- Grant chore completion rewards
  FOR v_rec IN
    SELECT id, chore_name_snapshot, reward_snapshot
      FROM chore_completions
     WHERE day_record_id = p_day_record_id
       AND completed_at IS NOT NULL
       AND reward_snapshot > 0
  LOOP
    INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
    VALUES (v_family_id, v_kid_id, 'kid', 'chore_completion_reward',
            jsonb_build_object('chore_name', v_rec.chore_name_snapshot, 'completion_id', v_rec.id),
            v_rec.reward_snapshot);
  END LOOP;

  -- Mark day as ended
  UPDATE day_records SET ended_at = now() WHERE id = p_day_record_id;

  INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
  VALUES (v_family_id, v_kid_id, 'kid', 'day_ended',
          jsonb_build_object('day_record_id', p_day_record_id),
          NULL);

  RETURN jsonb_build_object('success', true);
END;
$$;
```

**Why SECURITY DEFINER**: Follows the existing `apply_points_delta` pattern. The function validates the caller's identity internally using `auth.uid()`, so no RLS bypass risk.

**Why a single function**: Atomicity — PostgreSQL wraps the function in a transaction; any exception rolls back all writes.

## Existing Schema Context

Current action types in constraint (from migration 0015):
`chore_completed`, `chore_unchecked`, `rest_day_purchased`, `reward_redeemed`, `day_ended`, `penalty_applied`, `effort_awarded`, `chore_assigned`, `chore_unassigned`, `manual_adjustment`, `day_undone`, `penalty_reversed`, `effort_reversed`, `chore_completion_reward`, `chore_completion_reward_reversed`, `task_completed`, `task_completion_reversed`, `rest_day_reversed`

## State Transitions

### Day Record Lifecycle

```
Created -> [chores toggleable, tasks visible]
  | end_day() RPC — atomic: penalty + rewards logged, ended_at set
Ended (terminal — cannot be undone. Past days accessible via Calendar page.)
```

### Chore Completion Lifecycle

```
Incomplete (completed_at = null, uncheck_count = 0)
  | Complete
Completed (completed_at set)
  | Uncheck (if uncheck_count == 0 AND day not ended)
Incomplete (completed_at = null, uncheck_count = 1)
  | Complete (again)
Completed + Locked (completed_at set, uncheck_count = 1, checkbox disabled)
```

## Undo Eligibility Rules

| Action | Eligible When |
|--------|---------------|
| Uncheck Chore | `completed_at IS NOT NULL` AND `uncheck_count == 0` AND day not ended |
