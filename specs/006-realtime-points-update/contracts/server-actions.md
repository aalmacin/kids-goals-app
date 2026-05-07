# Server Action Contracts: Realtime Points Update

## Modified: `endDay`

**File**: `lib/actions/day-records.ts`

No signature change. Fix: change `revalidatePath('/dashboard')` → `revalidatePath('/')`.

```ts
export async function endDay(
  dayRecordId: string,
  effortLevelId?: string
): Promise<{ success: true } | { error: string }>
```

---

## New: `undoEndDay`

**File**: `lib/actions/day-records.ts`

```ts
export async function undoEndDay(
  dayRecordId: string
): Promise<{ success: true } | { error: string }>
```

### Preconditions

- Caller must be authenticated as a kid
- `day_records.kid_id` must match the authenticated kid
- `day_records.ended_at` must not be null (day must be ended)

### Side Effects

1. Fetches all `activity_log` rows for the day with `action_type IN ('penalty_applied', 'effort_awarded')` and non-null `points_delta`
2. Inserts `penalty_reversed` row with `points_delta = +original_penalty` for each `penalty_applied` found
3. Inserts `effort_reversed` row with `points_delta = -original_effort` for each `effort_awarded` found
4. Inserts `day_undone` row with `points_delta = null`
5. Updates `day_records SET ended_at = null, effort_level_id = null`
6. Calls `revalidatePath('/')`

### Postconditions

- `kids.points` reflects the pre-completion balance (DB trigger recalculates after each delta insert)
- `day_records.ended_at IS NULL` — day is re-opened for chore editing
- All reversals are recorded in `activity_log` for parent audit visibility

### Error Returns

| Condition | Error |
|-----------|-------|
| Not authenticated | throws `Error('Not authenticated')` |
| Kid not found | throws `Error('Kid not found')` |
| Day not ended | returns `{ error: 'Day has not been ended' }` |
| Day not owned by kid | returns `{ error: 'Not authorized' }` |

---

## Component Contracts

### Modified: `PointsBadge`

**File**: `components/navbar/PointsBadge.tsx`

Add `useEffect` to sync `initialPoints` prop changes to local state.

```tsx
useEffect(() => {
  setPoints(initialPoints)
}, [initialPoints])
```

### New: `UndoEndDayButton`

**File**: `components/end-day/UndoEndDayButton.tsx`

```tsx
interface UndoEndDayButtonProps {
  dayRecordId: string
}
```

- Renders a shadcn `AlertDialog` with confirmation ("Undo ending this day? Chore selections stay, but your points will be reversed.")
- Calls `undoEndDay(dayRecordId)` via `useTransition` on confirm
- Disabled while pending
```
