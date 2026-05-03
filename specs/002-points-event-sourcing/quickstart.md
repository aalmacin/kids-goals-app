# Quickstart: Points Event Sourcing & Manual Adjustment

**Branch**: `002-points-event-sourcing` | **Date**: 2026-04-30

This feature requires no new dependencies. All changes are to existing migrations, server actions, and UI.

## Apply the Migration

```bash
supabase migration new event_sourcing
# Copy migration content into supabase/migrations/0006_event_sourcing.sql
supabase db reset   # local dev — resets and re-applies all migrations
```

## Verify the Trigger

```sql
-- After reset, confirm trigger exists
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'after_activity_log_insert';

-- Confirm apply_points_delta is gone
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'apply_points_delta';
-- Should return 0 rows

-- Smoke test: insert a manual_adjustment event, check kids.points updates
INSERT INTO activity_log (family_id, kid_id, actor_type, action_type, metadata, points_delta)
VALUES ('<family_id>', '<kid_id>', 'parent', 'manual_adjustment', '{}', 50);
SELECT points FROM kids WHERE id = '<kid_id>';
-- Should reflect the new balance
```

## Run Tests

```bash
# Unit tests
bun run vitest

# E2E tests
bun run playwright test
```
