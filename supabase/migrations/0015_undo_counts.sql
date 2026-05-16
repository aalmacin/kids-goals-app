-- Add undo count columns for consistent one-undo-per-day reversal limits

-- day_records: track undo counts for end-day and rest-day
ALTER TABLE day_records
  ADD COLUMN undo_end_count integer NOT NULL DEFAULT 0 CHECK (undo_end_count >= 0);

ALTER TABLE day_records
  ADD COLUMN undo_rest_day_count integer NOT NULL DEFAULT 0 CHECK (undo_rest_day_count >= 0);

-- chore_completions: track uncheck count
ALTER TABLE chore_completions
  ADD COLUMN uncheck_count integer NOT NULL DEFAULT 0 CHECK (uncheck_count >= 0);

-- Add rest_day_reversed action type to activity_log constraint
ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment',
    'day_undone', 'penalty_reversed', 'effort_reversed',
    'chore_completion_reward', 'chore_completion_reward_reversed',
    'task_completed', 'task_completion_reversed',
    'rest_day_reversed'
  ));
