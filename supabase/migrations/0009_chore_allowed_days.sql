-- Add per-chore day-of-week schedule
-- allowed_days: array of weekday numbers 0=Sun...6=Sat; NULL means available every day
ALTER TABLE chores ADD COLUMN allowed_days smallint[] NULL;

-- Add family timezone for server-side local-date computation
ALTER TABLE families ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';
