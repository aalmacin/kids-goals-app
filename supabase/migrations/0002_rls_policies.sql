-- RLS policies for all tables

-- Helper: get the family_id for the current parent session
-- Helper: get the kid's id for the current kid session (via supabase_user_id)

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE effort_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FAMILIES
-- ============================================================
-- Parent can SELECT/UPDATE their own family
CREATE POLICY "parent_select_own_family" ON families
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "parent_insert_own_family" ON families
  FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "parent_update_own_family" ON families
  FOR UPDATE USING (parent_id = auth.uid());

-- Kid can SELECT the family they belong to
CREATE POLICY "kid_select_own_family" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- ============================================================
-- KIDS
-- ============================================================
-- Parent can do everything on kids in their family
CREATE POLICY "parent_all_kids" ON kids
  FOR ALL USING (
    family_id IN (SELECT id FROM families WHERE parent_id = auth.uid())
  );

-- Kid can SELECT their own row
CREATE POLICY "kid_select_self" ON kids
  FOR SELECT USING (supabase_user_id = auth.uid());

-- ============================================================
-- CHORES (library)
-- ============================================================
-- Parent can do everything on chores in their family
CREATE POLICY "parent_all_chores" ON chores
  FOR ALL USING (
    family_id IN (SELECT id FROM families WHERE parent_id = auth.uid())
  );

-- Kid can SELECT non-deleted chores in their family
CREATE POLICY "kid_select_chores" ON chores
  FOR SELECT USING (
    deleted_at IS NULL AND
    family_id IN (SELECT family_id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- ============================================================
-- CHORE_ASSIGNMENTS
-- ============================================================
-- Parent can do everything on assignments in their family
CREATE POLICY "parent_all_chore_assignments" ON chore_assignments
  FOR ALL USING (
    kid_id IN (
      SELECT k.id FROM kids k
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Kid can SELECT their own assignments
CREATE POLICY "kid_select_own_assignments" ON chore_assignments
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- ============================================================
-- EFFORT_LEVELS
-- ============================================================
-- Parent can do everything
CREATE POLICY "parent_all_effort_levels" ON effort_levels
  FOR ALL USING (
    family_id IN (SELECT id FROM families WHERE parent_id = auth.uid())
  );

-- Kid can SELECT
CREATE POLICY "kid_select_effort_levels" ON effort_levels
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- ============================================================
-- REWARDS
-- ============================================================
-- Parent can do everything
CREATE POLICY "parent_all_rewards" ON rewards
  FOR ALL USING (
    family_id IN (SELECT id FROM families WHERE parent_id = auth.uid())
  );

-- Kid can SELECT non-deleted rewards
CREATE POLICY "kid_select_rewards" ON rewards
  FOR SELECT USING (
    deleted_at IS NULL AND
    family_id IN (SELECT family_id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- ============================================================
-- DAY_RECORDS
-- ============================================================
-- Parent can SELECT all kids in their family
CREATE POLICY "parent_select_day_records" ON day_records
  FOR SELECT USING (
    kid_id IN (
      SELECT k.id FROM kids k
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Parent can INSERT/UPDATE day records for kids in their family
CREATE POLICY "parent_write_day_records" ON day_records
  FOR INSERT WITH CHECK (
    kid_id IN (
      SELECT k.id FROM kids k
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

CREATE POLICY "parent_update_day_records" ON day_records
  FOR UPDATE USING (
    kid_id IN (
      SELECT k.id FROM kids k
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Kid can SELECT/INSERT/UPDATE their own day records (when not ended)
CREATE POLICY "kid_select_own_day_records" ON day_records
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "kid_insert_own_day_records" ON day_records
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- Kids can update their own day records (server action enforces ended_at check)
CREATE POLICY "kid_update_own_day_records" ON day_records
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- ============================================================
-- CHORE_COMPLETIONS
-- ============================================================
-- Parent can SELECT all completions for their family
CREATE POLICY "parent_select_chore_completions" ON chore_completions
  FOR SELECT USING (
    day_record_id IN (
      SELECT dr.id FROM day_records dr
      JOIN kids k ON dr.kid_id = k.id
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Parent can INSERT/UPDATE completions
CREATE POLICY "parent_write_chore_completions" ON chore_completions
  FOR INSERT WITH CHECK (
    day_record_id IN (
      SELECT dr.id FROM day_records dr
      JOIN kids k ON dr.kid_id = k.id
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

CREATE POLICY "parent_update_chore_completions" ON chore_completions
  FOR UPDATE USING (
    day_record_id IN (
      SELECT dr.id FROM day_records dr
      JOIN kids k ON dr.kid_id = k.id
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Kid can SELECT/INSERT/UPDATE their own completions
CREATE POLICY "kid_select_own_completions" ON chore_completions
  FOR SELECT USING (
    day_record_id IN (
      SELECT id FROM day_records
      WHERE kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
    )
  );

CREATE POLICY "kid_insert_own_completions" ON chore_completions
  FOR INSERT WITH CHECK (
    day_record_id IN (
      SELECT id FROM day_records
      WHERE kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
    )
  );

CREATE POLICY "kid_update_own_completions" ON chore_completions
  FOR UPDATE USING (
    day_record_id IN (
      SELECT id FROM day_records
      WHERE kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
    )
  );

-- ============================================================
-- REWARD_REDEMPTIONS
-- ============================================================
-- Parent can SELECT all redemptions in their family
CREATE POLICY "parent_select_redemptions" ON reward_redemptions
  FOR SELECT USING (
    kid_id IN (
      SELECT k.id FROM kids k
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Kid can INSERT and SELECT their own redemptions
CREATE POLICY "kid_insert_own_redemptions" ON reward_redemptions
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "kid_select_own_redemptions" ON reward_redemptions
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- ============================================================
-- ACTIVITY_LOG
-- ============================================================
-- Parent can SELECT all entries for their family
CREATE POLICY "parent_select_activity_log" ON activity_log
  FOR SELECT USING (
    family_id IN (SELECT id FROM families WHERE parent_id = auth.uid())
  );

-- Parent can INSERT (via server actions only)
CREATE POLICY "parent_insert_activity_log" ON activity_log
  FOR INSERT WITH CHECK (
    family_id IN (SELECT id FROM families WHERE parent_id = auth.uid())
  );

-- Kid can SELECT entries for their family
CREATE POLICY "kid_select_activity_log" ON activity_log
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- Kid can INSERT (via server actions only)
CREATE POLICY "kid_insert_activity_log" ON activity_log
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM kids WHERE supabase_user_id = auth.uid())
  );
