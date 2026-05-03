# Data Model: Kid Comparison

## No Schema Changes

No new tables or columns are required. This feature reads from existing tables only.

## Existing Entities Used

### Kid

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `family_id` | uuid | Used to scope all siblings |
| `name` | string | Displayed on leaderboard |
| `points` | integer | All-time cumulative points; source for leaderboard ranking |

### DayRecord

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `kid_id` | uuid | FK → kids.id |
| `date` | string | ISO date (YYYY-MM-DD); filter for today |
| `is_rest_day` | boolean | Displayed as "Rest Day" on daily progress |
| `ended_at` | timestamp \| null | Whether the day is closed |

### ChoreCompletion

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `day_record_id` | uuid | FK → day_records.id |
| `completed_at` | timestamp \| null | Non-null = completed |

Used to compute `completedCount / totalCount` for daily progress.

### ActivityLog

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `family_id` | uuid | Scoped to family |
| `kid_id` | uuid \| null | Null for parent-only events |
| `points_delta` | integer \| null | Change in points for this event |
| `created_at` | timestamp | Filter `>= now() - 7 days` for weekly |

Weekly summary = `SUM(points_delta) WHERE kid_id = X AND created_at >= today - 7 days AND points_delta IS NOT NULL`.

## New RLS Policies

### `kid_select_sibling_kids` (on `kids` table)

Allows a kid to read all kids in the same family, enabling the leaderboard and daily progress grid.

### `kid_select_sibling_day_records` (on `day_records` table)

Allows a kid to read day records belonging to siblings in the same family, enabling daily chore progress display.

## Read Query Plan

```
getComparisonData(kidId, familyId, today, sevenDaysAgo):
  1. kids WHERE family_id = familyId ORDER BY points DESC
  2. day_records WHERE kid_id IN (sibling ids) AND date = today
        + chore_completions WHERE day_record_id IN (today's record ids)
  3. activity_log WHERE family_id = familyId AND kid_id IN (sibling ids)
        AND created_at >= sevenDaysAgo AND points_delta IS NOT NULL
        GROUP BY kid_id → SUM(points_delta)
```

All three queries use existing indexed columns and return O(n) rows where n = number of kids (typically ≤ 5).
