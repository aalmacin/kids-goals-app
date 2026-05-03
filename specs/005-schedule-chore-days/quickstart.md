# Quickstart & Test Scenarios: Chore Day Scheduling

**Branch**: `005-schedule-chore-days` | **Date**: 2026-05-03

## Prerequisites

- Local Supabase running (`supabase start`)
- Migration applied: `supabase db reset` or `supabase migration up`
- Seed data: one parent family, one kid, at least two chores assigned to the kid

---

## Manual Test Scenarios

### Scenario 1 — Set a Weekday-Only Schedule (US1, P1)

1. Log in as parent
2. Go to **Admin → Chores**
3. Find a chore → click Edit (or the day-schedule control)
4. Select Mon, Tue, Wed, Thu, Fri → Save
5. **Verify**: The chore shows "Mon–Fri" in the chore list
6. Update: select only Mon, Wed, Fri → Save
7. **Verify**: The chore now shows "Mon, Wed, Fri"
8. Clear all days → Save
9. **Verify**: The chore shows "Every day"

### Scenario 2 — Child Cannot Complete Restricted Chore (US2, P2)

Setup: Set a chore to a specific day that is NOT today (e.g., if today is Monday, set allowed_days = [2] for Tuesday only).

1. Log in as kid
2. Go to **Dashboard**
3. **Verify**: The restricted chore appears grayed out / unavailable
4. **Verify**: The chore shows the next available day (e.g., "Available Tuesday")
5. Attempt to complete the chore (if button is visible, click it)
6. **Verify**: Completion is blocked — no checkmark saved, error returned

Confirm server enforcement:
7. Directly call `toggleChore(completionId, true, dayRecordId)` via server action
8. **Verify**: Error thrown: `'Chore not available on this day'`

### Scenario 3 — Unrestricted Chore Always Available (US2 edge case)

Setup: Ensure one chore has no schedule set (NULL / cleared).

1. Log in as kid on any day of the week
2. **Verify**: The unrestricted chore appears available and can be completed normally

### Scenario 4 — Parent Sees Schedule Summary (US3, P3)

1. Log in as parent → Admin → Chores
2. Chore with schedule: **Verify** days displayed (e.g., "Mon, Wed, Fri")
3. Chore without schedule: **Verify** shows "Every day" or equivalent

---

## E2E Test Seeds (Playwright)

```typescript
// Seed: one chore with allowed_days = [1,2,3,4,5] (weekdays)
// Seed: one chore with allowed_days = null (always available)
// Test date: control via Playwright clock mock to a known weekday and weekend
```

Key E2E paths:
- `us-chore-schedule.spec.ts` — parent sets/updates/clears schedule (US1)
- `us-chore-schedule.spec.ts` — kid sees unavailable chore + next day text (US2)
- `us-chore-schedule.spec.ts` — server rejects toggle on non-scheduled day (US2 enforcement)
- `us-chore-schedule.spec.ts` — parent sees schedule summary in chore list (US3)

---

## Unit Test Cases (lib/chore-schedule.ts)

| Function | Input | Expected |
|----------|-------|----------|
| `isChoreAvailableOn` | `null, 0` | `true` |
| `isChoreAvailableOn` | `[], 0` | `true` |
| `isChoreAvailableOn` | `[1,2,3,4,5], 0` | `false` (Sunday) |
| `isChoreAvailableOn` | `[1,2,3,4,5], 1` | `true` (Monday) |
| `dayOfWeekFromDate` | `'2026-05-03'` | `0` (Sunday) |
| `dayOfWeekFromDate` | `'2026-05-04'` | `1` (Monday) |
| `getNextAvailableDate` | `[1], new Date('2026-05-03')` | `new Date('2026-05-04')` (Monday) |
| `getNextAvailableDate` | `null, new Date('2026-05-03')` | `null` |
