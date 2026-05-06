-- Helper function: get the family_id of the currently authenticated kid
CREATE OR REPLACE FUNCTION public.get_kid_family_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT family_id FROM kids WHERE supabase_user_id = auth.uid() LIMIT 1
$function$;

-- Auto-enable RLS on new tables created in the public schema
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- Allow kids to see chore completions for siblings in the same family
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chore_completions'
      AND policyname = 'kid_select_sibling_chore_completions'
  ) THEN
    CREATE POLICY "kid_select_sibling_chore_completions"
    ON "public"."chore_completions"
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((day_record_id IN (
      SELECT dr.id
      FROM (public.day_records dr
        JOIN public.kids k ON ((dr.kid_id = k.id)))
      WHERE (k.family_id = public.get_kid_family_id())
    )));
  END IF;
END $$;

-- Allow kids to see day records for siblings in the same family
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'day_records'
      AND policyname = 'kid_select_sibling_day_records'
  ) THEN
    CREATE POLICY "kid_select_sibling_day_records"
    ON "public"."day_records"
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((kid_id IN (
      SELECT kids.id
      FROM public.kids
      WHERE (kids.family_id = public.get_kid_family_id())
    )));
  END IF;
END $$;

-- Allow kids to see other kids in the same family
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids'
      AND policyname = 'kid_select_sibling_kids'
  ) THEN
    CREATE POLICY "kid_select_sibling_kids"
    ON "public"."kids"
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING ((family_id = public.get_kid_family_id()));
  END IF;
END $$;
