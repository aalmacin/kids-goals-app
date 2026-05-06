-- RLS policies to allow kids to read sibling data for the comparison feature

-- Kids can SELECT all kids in their family (for leaderboard and daily progress)
CREATE POLICY "kid_select_sibling_kids" ON kids
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM kids WHERE supabase_user_id = auth.uid()
    )
  );

-- Kids can SELECT day_records for all siblings in their family (for daily progress)
CREATE POLICY "kid_select_sibling_day_records" ON day_records
  FOR SELECT USING (
    kid_id IN (
      SELECT id FROM kids WHERE family_id IN (
        SELECT family_id FROM kids WHERE supabase_user_id = auth.uid()
      )
    )
  );

-- Kids can SELECT chore_completions for sibling day_records (for daily progress counts)
CREATE POLICY "kid_select_sibling_chore_completions" ON chore_completions
  FOR SELECT USING (
    day_record_id IN (
      SELECT dr.id FROM day_records dr
      JOIN kids k ON dr.kid_id = k.id
      WHERE k.family_id IN (
        SELECT family_id FROM kids WHERE supabase_user_id = auth.uid()
      )
    )
  );
