-- Fix infinite recursion in RLS policies (PostgreSQL error 42P17)
--
-- The cycle: families.kid_select_own_family → queries kids
--            kids.parent_all_kids → queries families → back to start
--
-- Solution: a SECURITY DEFINER function that queries families bypassing RLS,
-- used by all policies that need to resolve the current parent's family_id.

CREATE OR REPLACE FUNCTION public.get_auth_family_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM families WHERE parent_id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- KIDS
-- ============================================================
DROP POLICY IF EXISTS "parent_all_kids" ON kids;
CREATE POLICY "parent_all_kids" ON kids
  FOR ALL USING (family_id = public.get_auth_family_id());

-- ============================================================
-- CHORES
-- ============================================================
DROP POLICY IF EXISTS "parent_all_chores" ON chores;
CREATE POLICY "parent_all_chores" ON chores
  FOR ALL USING (family_id = public.get_auth_family_id());

-- ============================================================
-- CHORE_ASSIGNMENTS
-- ============================================================
DROP POLICY IF EXISTS "parent_all_chore_assignments" ON chore_assignments;
CREATE POLICY "parent_all_chore_assignments" ON chore_assignments
  FOR ALL USING (
    kid_id IN (
      SELECT id FROM kids WHERE family_id = public.get_auth_family_id()
    )
  );

-- ============================================================
-- EFFORT_LEVELS
-- ============================================================
DROP POLICY IF EXISTS "parent_all_effort_levels" ON effort_levels;
CREATE POLICY "parent_all_effort_levels" ON effort_levels
  FOR ALL USING (family_id = public.get_auth_family_id());

-- ============================================================
-- REWARDS
-- ============================================================
DROP POLICY IF EXISTS "parent_all_rewards" ON rewards;
CREATE POLICY "parent_all_rewards" ON rewards
  FOR ALL USING (family_id = public.get_auth_family_id());

-- ============================================================
-- DAY_RECORDS
-- ============================================================
DROP POLICY IF EXISTS "parent_select_day_records" ON day_records;
CREATE POLICY "parent_select_day_records" ON day_records
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id = public.get_auth_family_id())
  );

DROP POLICY IF EXISTS "parent_write_day_records" ON day_records;
CREATE POLICY "parent_write_day_records" ON day_records
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE family_id = public.get_auth_family_id())
  );

DROP POLICY IF EXISTS "parent_update_day_records" ON day_records;
CREATE POLICY "parent_update_day_records" ON day_records
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE family_id = public.get_auth_family_id())
  );

-- ============================================================
-- CHORE_COMPLETIONS
-- ============================================================
DROP POLICY IF EXISTS "parent_select_chore_completions" ON chore_completions;
CREATE POLICY "parent_select_chore_completions" ON chore_completions
  FOR SELECT USING (
    day_record_id IN (
      SELECT dr.id FROM day_records dr
      JOIN kids k ON dr.kid_id = k.id
      WHERE k.family_id = public.get_auth_family_id()
    )
  );

DROP POLICY IF EXISTS "parent_write_chore_completions" ON chore_completions;
CREATE POLICY "parent_write_chore_completions" ON chore_completions
  FOR INSERT WITH CHECK (
    day_record_id IN (
      SELECT dr.id FROM day_records dr
      JOIN kids k ON dr.kid_id = k.id
      WHERE k.family_id = public.get_auth_family_id()
    )
  );

DROP POLICY IF EXISTS "parent_update_chore_completions" ON chore_completions;
CREATE POLICY "parent_update_chore_completions" ON chore_completions
  FOR UPDATE USING (
    day_record_id IN (
      SELECT dr.id FROM day_records dr
      JOIN kids k ON dr.kid_id = k.id
      WHERE k.family_id = public.get_auth_family_id()
    )
  );

-- ============================================================
-- REWARD_REDEMPTIONS
-- ============================================================
DROP POLICY IF EXISTS "parent_select_redemptions" ON reward_redemptions;
CREATE POLICY "parent_select_redemptions" ON reward_redemptions
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE family_id = public.get_auth_family_id())
  );

-- ============================================================
-- ACTIVITY_LOG
-- ============================================================
DROP POLICY IF EXISTS "parent_select_activity_log" ON activity_log;
CREATE POLICY "parent_select_activity_log" ON activity_log
  FOR SELECT USING (family_id = public.get_auth_family_id());

DROP POLICY IF EXISTS "parent_insert_activity_log" ON activity_log;
CREATE POLICY "parent_insert_activity_log" ON activity_log
  FOR INSERT WITH CHECK (family_id = public.get_auth_family_id());
