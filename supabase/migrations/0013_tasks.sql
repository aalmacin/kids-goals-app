-- Tasks: one-time and repeated task types for kids to complete and earn points

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  points integer NOT NULL CHECK (points > 0),
  task_type text NOT NULL CHECK (task_type IN ('one_time', 'repeated')),
  max_completions integer CHECK (max_completions IS NULL OR max_completions > 0),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  kid_id uuid NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  task_name_snapshot text NOT NULL,
  points_snapshot integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent a kid from completing a one-time task more than once
CREATE OR REPLACE FUNCTION check_one_time_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT task_type FROM tasks WHERE id = NEW.task_id) = 'one_time' THEN
    IF EXISTS (
      SELECT 1 FROM task_completions
      WHERE task_id = NEW.task_id AND kid_id = NEW.kid_id
    ) THEN
      RAISE EXCEPTION 'One-time task already completed by this kid';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_one_time_task_completion
  BEFORE INSERT ON task_completions
  FOR EACH ROW EXECUTE FUNCTION check_one_time_task_completion();

-- ============================================================
-- activity_log: add 'task_completed' action type
-- ============================================================

ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment',
    'day_undone', 'penalty_reversed', 'effort_reversed',
    'chore_completion_reward', 'chore_completion_reward_reversed',
    'task_completed'
  ));

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: tasks
-- ============================================================

-- Parent can do everything on tasks in their family
CREATE POLICY "parent_all_tasks" ON tasks
  FOR ALL USING (
    family_id IN (SELECT id FROM families WHERE parent_id = auth.uid())
  );

-- Kid can SELECT non-deleted tasks in their family
CREATE POLICY "kid_select_tasks" ON tasks
  FOR SELECT USING (
    deleted_at IS NULL AND
    family_id IN (SELECT family_id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- ============================================================
-- RLS: task_completions
-- ============================================================

-- Parent can SELECT completions for kids in their family
CREATE POLICY "parent_select_task_completions" ON task_completions
  FOR SELECT USING (
    kid_id IN (
      SELECT k.id FROM kids k
      JOIN families f ON k.family_id = f.id
      WHERE f.parent_id = auth.uid()
    )
  );

-- Kid can SELECT their own completions
CREATE POLICY "kid_select_own_task_completions" ON task_completions
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );

-- Kid can INSERT their own completions (server action enforces idempotency)
CREATE POLICY "kid_insert_own_task_completions" ON task_completions
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );
