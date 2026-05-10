# Data Model: Realtime Points Update on Day Completion

## Schema Changes Required

### New migration: `0010_undo_end_day.sql`

Adds three new values to the `activity_log.action_type` CHECK constraint:

| New action_type | points_delta | Meaning |
|----------------|--------------|---------|
| `day_undone` | null | Audit record: a day completion was reversed |
| `penalty_reversed` | positive integer | Cancels a prior `penalty_applied` delta |
| `effort_reversed` | negative integer | Cancels a prior `effort_awarded` delta |

No new tables or columns are needed. The existing event-sourcing trigger (`recalculate_kid_points`) picks up the new reversal deltas automatically.

---

## Relevant Entities

### kids

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| points | integer | Running balance; recalculated by `recalculate_kid_points` trigger |
| supabase_user_id | uuid | Links to Supabase Auth user |

`kids.points` is the source of truth for all UI displays. Supabase Realtime broadcasts `UPDATE` events on this table (included in the default `supabase_realtime` publication).

### activity_log

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| kid_id | uuid | FK to kids |
| action_type | text (enum) | Extended: add `day_undone`, `penalty_reversed`, `effort_reversed` |
| points_delta | integer \| null | Non-null entries trigger `recalculate_kid_points` |

### day_records

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| kid_id | uuid | FK to kids |
| ended_at | timestamptz \| null | Reset to null by `undoEndDay` |
| effort_level_id | uuid \| null | Reset to null by `undoEndDay` |

No new columns needed.

---

## State Flows

### End Day

```
endDay(dayRecordId, effortLevelId?)
  → INSERT activity_log: penalty_applied (delta = -penalty, if penalty > 0)
  → INSERT activity_log: effort_awarded  (delta = +effort,  if effort > 0)
  → INSERT activity_log: day_ended       (delta = null)
  → UPDATE day_records: ended_at = now()
  → DB trigger: recalculate kids.points
  → Supabase Realtime: UPDATE on kids → PointsBadge.setPoints()
  → revalidatePath('/'): layout re-renders → useEffect syncs initialPoints
```

### Undo End Day

```
undoEndDay(dayRecordId)
  → fetch activity_log entries for this day with non-null points_delta
  → INSERT activity_log: penalty_reversed (delta = +penalty) for each penalty_applied
  → INSERT activity_log: effort_reversed  (delta = -effort)  for each effort_awarded
  → INSERT activity_log: day_undone       (delta = null)
  → UPDATE day_records: ended_at = null, effort_level_id = null
  → DB trigger: recalculate kids.points (fires per non-null delta insertion)
  → Supabase Realtime: UPDATE on kids → PointsBadge.setPoints()
  → revalidatePath('/'): layout re-renders → useEffect syncs initialPoints
```

### Validation Rules

- `undoEndDay` must verify `day_records.ended_at IS NOT NULL` before proceeding (no-op otherwise)
- `undoEndDay` must be called by the kid who owns the day record (server action verifies via `auth.getUser()`)
- After undo, the kid can re-complete the day normally (FR spec assumption: "as if for the first time")
