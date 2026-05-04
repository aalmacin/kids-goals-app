# Data Model: Family Page (005-kid-comparison)

## No New Database Tables

No schema changes required. All data comes from existing tables.

## Types (lib/db/family.ts)

### FamilyMember (renamed from SiblingKid)

```typescript
type FamilyMember = {
  id: string
  name: string
  points: number
}
```

### DailyProgressEntry

```typescript
type DailyProgressEntry = {
  kidId: string
  name: string
  completedCount: number
  totalCount: number
  isRestDay: boolean
  pointsEarnedToday: number  // summed from activity_log for today
}
```

### WeeklySummaryEntry (unchanged)

```typescript
type WeeklySummaryEntry = {
  kidId: string
  name: string
  weeklyPoints: number
}
```

## DB Functions (lib/db/family.ts)

### getFamilyMembers(familyId: string): Promise<FamilyMember[]>
Renamed from `getSiblings`. Returns all kids in the family ordered by points descending.
- Table: `kids`
- Filter: `family_id = familyId`
- Fallback: returns `[]` on error (caller falls back to rendering logged-in kid only)
- RLS: `kid_select_sibling_kids` policy (migration 0007)

### getTodayDailyProgress(members, today)
Extended to populate `pointsEarnedToday` from `activity_log`.
- Tables: `day_records`, `chore_completions`, `activity_log`
- `activity_log` filter: `kid_id IN [...] AND DATE(created_at) = today AND points_delta IS NOT NULL`

### getWeeklyPointsSummary(familyId, members, sevenDaysAgo)
Unchanged. Aggregates `activity_log.points_delta` over 7 days.

## Existing Entities Used

### kids
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | PK |
| `family_id` | uuid | Scopes the family query |
| `name` | string | Displayed in all three sections |
| `points` | integer | All-time cumulative; source for leaderboard rank |

### day_records
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | PK |
| `kid_id` | uuid | FK → kids.id |
| `date` | string | ISO date; filter for today |
| `is_rest_day` | boolean | Shown as "Rest Day" badge |

### chore_completions
| Field | Type | Notes |
|-------|------|-------|
| `day_record_id` | uuid | FK → day_records.id |
| `completed_at` | timestamp \| null | Non-null = completed |

### activity_log
| Field | Type | Notes |
|-------|------|-------|
| `family_id` | uuid | Scopes to family |
| `kid_id` | uuid \| null | Filter for per-kid aggregation |
| `points_delta` | integer \| null | Summed for weekly and today's points |
| `created_at` | timestamp | Filter for 7-day window and today |

## TanStack Query Keys

```typescript
['familyMembers', familyId]     // invalidated by Realtime kids UPDATE
['dailyProgress', familyId, today]
['weeklySummary', familyId, sevenDaysAgo]
```

## RLS Dependencies

Migration `0007_kid_comparison_rls.sql` must be applied:
- `kid_select_sibling_kids` — cross-family kid reads
- `kid_select_sibling_day_records` — cross-family day_record reads
- `kid_select_sibling_chore_completions` — cross-family chore_completion reads

Activity log family reads covered by `kid_select_activity_log` (migration 0002).
