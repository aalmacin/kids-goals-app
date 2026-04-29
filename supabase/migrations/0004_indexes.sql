-- Performance indexes
CREATE INDEX ON chore_assignments (kid_id);
CREATE INDEX ON day_records (kid_id, date);
CREATE INDEX ON chore_completions (day_record_id);
CREATE INDEX ON activity_log (family_id, created_at DESC);
CREATE INDEX ON reward_redemptions (kid_id);
