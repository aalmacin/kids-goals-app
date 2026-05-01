# Data Model: Points Event Sourcing & Manual Adjustment

**Branch**: `002-points-event-sourcing` | **Date**: 2026-04-30

## Changes to Existing Schema

This feature makes no structural changes to tables beyond the `activity_log.action_type` constraint and the addition of a DB trigger. No new tables are introduced.

---

### `activity_log` — modified

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| family_id | uuid | NOT NULL, FK → families(id) ON DELETE CASCADE |
| kid_id | uuid | FK → kids(id) ON DELETE SET NULL, nullable |
| actor_type | text | NOT NULL, CHECK IN ('parent', 'kid') |
| action_type | text | NOT NULL, CHECK IN (...existing..., **'manual_adjustment'**) |
| metadata | jsonb | NOT NULL DEFAULT '{}' |
| points_delta | integer | nullable |
| created_at | timestamptz | NOT NULL DEFAULT now() |

**Change**: `action_type` CHECK constraint extended to include `'manual_adjustment'`.

**Metadata shape for `manual_adjustment`**:
```json
{
  "reason": "optional free-text string",
  "adjusted_by_parent_id": "uuid of the parent who submitted the adjustment"
}
```

---

### `kids` — read cache maintained by trigger

| Column | Type | Notes |
|--------|------|-------|
| points | integer | NOT NULL DEFAULT 0, CHECK (points >= 0) — **written only by trigger** |

No column changes. `points` remains the cached balance. After this migration, no application code writes to this column directly; only the trigger does.

---

## New Database Objects

### Trigger Function: `recalculate_kid_points()`

- **Fires**: AFTER INSERT on `activity_log`, FOR EACH ROW
- **Condition**: `NEW.kid_id IS NOT NULL AND NEW.points_delta IS NOT NULL`
- **Effect**: Sets `kids.points = GREATEST(0, SUM(activity_log.points_delta) FOR kid))`
- **Security**: `SECURITY DEFINER` with `search_path = public`

### Trigger: `after_activity_log_insert`

- **Table**: `activity_log`
- **Timing**: AFTER INSERT
- **Granularity**: FOR EACH ROW
- **Function**: `recalculate_kid_points()`

---

## Removed Database Objects

### Dropped: `apply_points_delta(kid_id uuid, delta integer)`

The RPC function in migration `0003_points_function.sql` is dropped by migration `0006_event_sourcing.sql`. Its responsibilities are fully absorbed by the trigger.

---

## Migration Sequence

| Migration | Description |
|-----------|-------------|
| `0006_event_sourcing.sql` | 1. Seed existing balances as `manual_adjustment` events<br>2. Add `manual_adjustment` to `action_type` CHECK<br>3. Create `recalculate_kid_points()` trigger function<br>4. Create `after_activity_log_insert` trigger<br>5. Drop `apply_points_delta` function |

The seed step runs before the trigger is created so the seed inserts do not cause recursive recalculation against stale sums.

---

## RLS Impact

No new RLS policies required. The `manual_adjustment` action type is inserted by a Server Action running under the parent's authenticated session. Existing `activity_log` RLS policies (parent can insert for their family; kids can read their own entries) are unchanged.
