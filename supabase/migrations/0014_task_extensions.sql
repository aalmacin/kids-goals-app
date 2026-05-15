-- Task Extensions: once_per_day flag, undo support, task_completion_reversed action type

-- ============================================================
-- ADD once_per_day COLUMN TO tasks
-- ============================================================

ALTER TABLE tasks ADD COLUMN once_per_day boolean NOT NULL DEFAULT false;

-- ============================================================
-- UPDATE activity_log action_type CHECK to include task_completion_reversed
-- ============================================================

ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment',
    'day_undone', 'penalty_reversed', 'effort_reversed',
    'chore_completion_reward', 'chore_completion_reward_reversed',
    'task_completed', 'task_completion_reversed'
  ));

-- ============================================================
-- RLS: Allow kids to DELETE their own task_completions (for undo)
-- ============================================================

CREATE POLICY "kid_delete_own_task_completions" ON task_completions
  FOR DELETE USING (
    kid_id IN (SELECT id FROM kids WHERE supabase_user_id = auth.uid())
  );
