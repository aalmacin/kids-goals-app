-- Add reward_points to chores library (mirrors penalty column)
ALTER TABLE chores
  ADD COLUMN reward_points integer NOT NULL DEFAULT 0 CHECK (reward_points >= 0);

-- Add reward snapshot to chore_completions (mirrors penalty_snapshot column)
ALTER TABLE chore_completions
  ADD COLUMN reward_snapshot integer NOT NULL DEFAULT 0 CHECK (reward_snapshot >= 0);

-- Extend activity_log action_type constraint to include chore_completion_reward
ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
  CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned', 'manual_adjustment',
    'chore_completion_reward'
  ));
