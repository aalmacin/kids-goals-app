# Data Model: Realtime Points Update on Day Completion

No database schema changes are required for this feature.

## Relevant Entities

### kids

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| points | integer | Running balance; updated synchronously by `apply_points_delta` DB trigger |
| supabase_user_id | uuid | Links to Supabase Auth user |

The `points` column is the source of truth read by `DashboardLayout` and broadcast via Supabase Realtime on every UPDATE.

### activity_log

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| kid_id | uuid | FK to kids |
| points_delta | integer \| null | Non-null entries trigger the `apply_points_delta` trigger |
| action_type | enum | e.g. `penalty_applied`, `effort_awarded`, `day_ended` |

Inserting a row with a non-null `points_delta` atomically updates `kids.points` via the DB trigger. A `day_ended` row carries `null` delta and does not change the balance.

## State Flow (no schema change needed)

```
endDay() server action
  → inserts activity_log rows (with/without points_delta)
  → DB trigger updates kids.points (when delta is non-null)
  → Supabase Realtime fires UPDATE on kids → PointsBadge.setPoints()
  → revalidatePath('/dashboard') re-renders layout → new initialPoints prop
  → useEffect([initialPoints]) → PointsBadge.setPoints()   ← NEW
```
