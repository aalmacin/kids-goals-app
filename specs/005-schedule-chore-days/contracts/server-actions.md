# Server Action Contracts: Chore Day Scheduling

**Branch**: `005-schedule-chore-days` | **Date**: 2026-05-03

---

## Modified: `createChoreAction` (lib/actions/chores.ts)

**Change**: Accepts `allowedDays` from FormData.

```typescript
// FormData fields added:
// allowedDays: string  — JSON-encoded number[] e.g. "[1,2,3,4,5]"; empty string = no restriction

export async function createChoreAction(formData: FormData): Promise<void>
```

**Behavior**: Parses `allowedDays` from FormData, passes to `createChore`. Empty string or absent field stores NULL.

---

## Modified: `updateChoreAction` (lib/actions/chores.ts)

**Change**: Accepts `allowedDays` from FormData.

```typescript
// FormData fields added:
// allowedDays: string  — JSON-encoded number[]; empty string clears the schedule

export async function updateChoreAction(choreId: string, formData: FormData): Promise<void>
```

**Behavior**: Parses and passes `allowedDays` to `updateChore`. Passing `[]` stores NULL (clears schedule).

---

## New: `updateChoreScheduleAction` (lib/actions/chores.ts)

Dedicated action for updating only the schedule (used by inline day-selector UI).

```typescript
export async function updateChoreScheduleAction(
  choreId: string,
  allowedDays: number[]
): Promise<void>
```

**Auth**: Parent only (calls `requireParentFamily()`).
**Validation**: Rejects day numbers outside 0–6.
**Revalidates**: `/admin/chores`

---

## Modified: `toggleChore` (lib/actions/day-records.ts)

**Change**: Validates chore schedule before toggling completion.

```typescript
export async function toggleChore(
  completionId: string,
  completed: boolean,
  dayRecordId: string
): Promise<ChoreCompletion>
```

**Added guard** (when `completed` is true):
1. Fetch `chore_completions` row to get `chore_assignment_id`
2. Fetch `chore_assignments` → `chores.allowed_days`
3. Compute day-of-week from `day_records.date`
4. Call `isChoreAvailableOn(allowedDays, dayOfWeek)`
5. If not available: `throw new Error('Chore not available on this day')`

**Note**: The guard only applies when `completed = true`. Unchecking a chore is always allowed.

---

## Modified: `getOrCreateDayRecord` (lib/db/day-records.ts)

**Change**: When seeding `chore_completions` for a new day record, skip chores whose `allowed_days` excludes the day-of-week of `day_records.date`.

```typescript
// In chore fetch, include allowed_days:
await supabase.from('chores')
  .select('id, name, penalty, is_important, deleted_at, allowed_days')
  .in('id', choreIds)

// Filter before inserting completions:
.filter(({ chore }) =>
  chore &&
  !chore.deleted_at &&
  isChoreAvailableOn(chore.allowed_days, dayOfWeekFromDate(newRecord.date))
)
```

**Backfill path** (existing day record): Same filter applied when adding new assignments.
