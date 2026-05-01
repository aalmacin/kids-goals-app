-- Event sourcing: make activity_log the source of truth for kids.points
-- Step 1: Seed existing balances as manual_adjustment events for any kid where
--         kids.points diverges from the sum of existing activity_log entries.
INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
SELECT
  k.family_id,
  k.id,
  'parent',
  'manual_adjustment',
  '{"reason": "Event sourcing migration: seed legacy balance"}'::jsonb,
  k.points - COALESCE(log_sum.total, 0)
FROM kids k
LEFT JOIN (
  SELECT kid_id, SUM(points_delta) AS total
  FROM activity_log
  WHERE points_delta IS NOT NULL
  GROUP BY kid_id
) log_sum ON log_sum.kid_id = k.id
WHERE k.points - COALESCE(log_sum.total, 0) <> 0;

-- Step 2: Update action_type CHECK constraint to include 'manual_adjustment'
ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment'
  ));

-- Step 3: Create trigger function that recalculates kids.points from activity_log
CREATE OR REPLACE FUNCTION recalculate_kid_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Step 4: Create trigger on activity_log
CREATE TRIGGER after_activity_log_insert
AFTER INSERT ON activity_log
FOR EACH ROW EXECUTE FUNCTION recalculate_kid_points();

-- Step 5: Drop apply_points_delta — replaced by the trigger above
DROP FUNCTION IF EXISTS apply_points_delta(uuid, integer);
