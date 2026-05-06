-- Fix infinite recursion in kid sibling RLS policies (error 42P17)
--
-- The cycle: kid_select_sibling_kids evaluates
--   SELECT family_id FROM kids WHERE supabase_user_id = auth.uid()
-- which triggers RLS on kids again → kid_select_sibling_kids → repeat.
--
-- Solution: a SECURITY DEFINER function that resolves the current kid's
-- family_id without going through RLS, following the same pattern as
-- get_auth_family_id() introduced in migration 0005.

CREATE OR REPLACE FUNCTION public.get_kid_family_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT family_id FROM kids WHERE supabase_user_id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- KIDS
-- ============================================================
DROP POLICY IF EXISTS "kid_select_sibling_kids" ON kids;
CREATE POLICY "kid_select_sibling_kids" ON kids
  FOR SELECT USING (
    family_id = public.get_kid_family_id()
  );

-- ============================================================
-- DAY_RECORDS
-- ============================================================
DROP POLICY IF EXISTS "kid_select_sibling_day_records" ON day_records;
CREATE POLICY "kid_select_sibling_day_records" ON day_records
  FOR SELECT USING (
    kid_id IN (
      SELECT id FROM kids WHERE family_id = public.get_kid_family_id()
    )
  );

-- ============================================================
-- CHORE_COMPLETIONS
-- ============================================================
DROP POLICY IF EXISTS "kid_select_sibling_chore_completions" ON chore_completions;
CREATE POLICY "kid_select_sibling_chore_completions" ON chore_completions
  FOR SELECT USING (
    day_record_id IN (
      SELECT dr.id FROM day_records dr
      JOIN kids k ON dr.kid_id = k.id
      WHERE k.family_id = public.get_kid_family_id()
    )
  );
