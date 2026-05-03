# Research: Points Event Sourcing & Manual Adjustment

**Branch**: `002-points-event-sourcing` | **Date**: 2026-04-30

## 1. Trigger vs. Application-Level Cache Maintenance

**Decision**: Use a Postgres AFTER INSERT trigger on `activity_log` to recalculate `kids.points`.

**Pattern**:
```sql
CREATE OR REPLACE FUNCTION recalculate_kid_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.kid_id IS NOT NULL AND NEW.points_delta IS NOT NULL THEN
    UPDATE kids
    SET points = GREATEST(0, (
      SELECT COALESCE(SUM(points_delta), 0)
      FROM activity_log
      WHERE kid_id = NEW.kid_id AND points_delta IS NOT NULL
    ))
    WHERE id = NEW.kid_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_activity_log_insert
AFTER INSERT ON activity_log
FOR EACH ROW EXECUTE FUNCTION recalculate_kid_points();
```

**Rationale**: A DB trigger makes it structurally impossible for `kids.points` to drift — the balance is always recomputed from the log at insert time. Application code cannot skip the update by mistake because there is no application-level update call.

**Alternatives considered**:
- Application-level recalculation after every insert — rejected because any code path that forgets the SUM call silently drifts the cache.
- Keep `apply_points_delta` alongside a trigger — rejected because both would update `points`, creating double-responsibility with no clear winner.

---

## 2. Migration Strategy for Existing Balances

**Decision**: Seed existing balances with a one-time `manual_adjustment` event per kid where `kids.points` diverges from the sum of existing `activity_log` entries.

**Pattern** (run once in migration, before creating the trigger):
```sql
INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
SELECT
  k.family_id,
  k.id,
  'parent',
  'manual_adjustment',
  '{"reason": "Event sourcing migration: seed legacy balance"}',
  k.points - COALESCE(log_sum.total, 0)
FROM kids k
LEFT JOIN (
  SELECT kid_id, SUM(points_delta) AS total
  FROM activity_log
  WHERE points_delta IS NOT NULL
  GROUP BY kid_id
) log_sum ON log_sum.kid_id = k.id
WHERE k.points - COALESCE(log_sum.total, 0) <> 0;
```

After this seed and once the trigger is live, `kids.points` always equals the sum of all `activity_log.points_delta` entries for that kid (floored at 0).

**Rationale**: Preserves existing balances without zeroing out kids who have earned points before this migration. The seed event is traceable in the audit log.

**Alternatives considered**:
- Zero out all balances and start fresh — rejected; destroys existing kid progress.
- Keep `kids.points` as a manual override column untouched by the trigger — rejected; defeats the purpose of event sourcing.

---

## 3. `action_type` CHECK Constraint Modification

**Decision**: Drop and recreate the CHECK constraint on `activity_log.action_type` to add `'manual_adjustment'`.

**Pattern**:
```sql
ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment'
  ));
```

**Rationale**: Postgres does not support ALTER CONSTRAINT to change check expressions; drop + add is the standard approach.

---

## 4. Removing `apply_points_delta` RPC

**Decision**: Drop `apply_points_delta` after the trigger is in place. Remove all three call sites in application code (`declareRestDay`, `endDay`, `redeemReward`).

**Call sites to remove**:
- `lib/actions/day-records.ts` — `declareRestDay`: `supabase.rpc('apply_points_delta', { kid_id: kid.id, delta: -100 })`
- `lib/actions/day-records.ts` — `endDay`: `supabase.rpc('apply_points_delta', { kid_id: kidId, delta: -totalPenalty })`
- `lib/actions/day-records.ts` — `endDay`: `supabase.rpc('apply_points_delta', { kid_id: kidId, delta: effortPoints })`
- `lib/actions/rewards.ts` — `redeemReward`: `supabase.rpc('apply_points_delta', { kid_id: kid.id, delta: -reward.points_cost })`

After removal, `activity_log.insert(...)` is the only write needed; the trigger handles the cache.

**Rationale**: A dead RPC that is no longer called but still exists creates confusion about the authoritative update path. Dropping it makes the contract clear.
