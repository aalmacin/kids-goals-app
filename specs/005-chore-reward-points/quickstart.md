# Quickstart: Chore Completion Reward Points

## Prerequisites

- Local Supabase running (`bun run db:start`)
- Dependencies installed (`bun install`)

## Apply the Migration

```bash
bun run db:reset
# or to apply incrementally against a running local instance:
supabase migration up
```

## Run Tests

```bash
# Unit tests
bun vitest run __tests__/unit/

# Integration tests (requires local Supabase)
bun vitest run __tests__/integration/

# E2E tests
bun playwright test __tests__/e2e/us11-chore-reward.spec.ts
```

## Manual Verification Flow

1. **Parent**: Go to `/admin/chores` → Add a chore with `Reward Points = 10`
2. **Parent**: Assign chore to a kid
3. **Kid**: Log in and go to dashboard (`/`)
4. **Kid**: See the chore tile showing `+10 pts` (uncompleted)
5. **Kid**: Check the chore → tile still shows `+10 pts` (confirming reward queued), balance unchanged
6. **Kid**: End Day is triggered → balance increases by 10
7. **Parent**: View `/activity` → see one `chore_completion_reward` event with chore name and `+10 pts`

### Negative verification

1. **Kid**: Check a chore with reward, then uncheck it before End Day
2. **Parent**: Trigger End Day → balance does NOT increase for that chore; no reward event in log

### Undo End Day verification (bug fix — FR-013)

1. **Kid**: Check ALL chores (no penalty should be applied)
2. **Parent**: Trigger End Day → balance increases by effort level only (e.g. +15)
3. **Parent**: Undo End Day → balance returns to exactly the pre-End-Day value (net change: −15)
4. **Repeat step 2–3** several times → balance must not drift upward (confirms no phantom reversal events are being created)

### Zero-value badge fix (chores page)

1. Go to `/admin/chores`
2. Any chore with `Penalty Points = 0` must show **no penalty badge** (no `-0 pts`)
3. Any chore with `Reward Points = 0` must show **no reward badge**
4. A chore with `penalty = 3, reward = 0` shows only `-3 pts`
5. A chore with `penalty = 0, reward = 10` shows only `+10 pts`

### Effort dropdown display bug fix (FR-014)

1. Open the End Day dialog (kid must have all chores done for the effort dropdown to appear)
2. Select any effort level (e.g., "Awesome (+15 pts)")
3. The trigger must display the label text — **not** a UUID string
4. Confirm End Day — effort points are applied correctly

### Edit form reward points fix (FR-015)

1. Go to `/admin/chores`
2. Click **Edit** on any chore to open the edit panel
3. Change Reward Points from 0 to 10 and click **Save Changes**
4. On success: the edit panel closes automatically and a `+10 pts` badge appears on the chore
5. On failure: an inline red error message appears below the Save Changes button — never a silent no-op
6. If a DB error occurs (e.g., migration not applied), check server logs for `[updateChoreAction]` error messages and run `bun run db:reset` to apply all migrations
7. Verify the **Save Schedule** button (day picker) and **Save Changes** button (edit form) are clearly labelled and distinct

## Key Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/0011_chore_reward_points.sql` | Schema: `reward_points` on chores, `reward_snapshot` on chore_completions, updated constraint |
| `supabase/migrations/0012_reward_reversal_event_type.sql` | Schema: adds `chore_completion_reward_reversed` action type |
| `lib/types.ts` | `Chore.reward`, `ChoreCompletion.rewardSnapshot`, `chore_completion_reward` action type |
| `lib/points.ts` | `calculateChoreRewards(completions)` helper |
| `lib/db/chores.ts` | `createChore` / `updateChore` accept `reward` |
| `lib/db/day-records.ts` | Seed `reward_snapshot` when creating completions |
| `lib/actions/chores.ts` | `updateChoreAction` returns `{ error, savedAt }` for `useActionState`; try/catch with server logging |
| `lib/actions/day-records.ts` | `endDay` inserts `chore_completion_reward` per completed rewarded chore; `undoEndDay` reversal fix |
| `components/chore-list/ChoreEditForm.tsx` | New client component owning `<details>` wrapper; closes panel on success via `detailsRef`; calls `router.refresh()` |
| `components/chore-list/ChoreScheduleEditor.tsx` | Button renamed to "Save Schedule" |
| `components/chore-list/ChoreItem.tsx` | Show `+N pts` reward badge on both completed and uncompleted tiles |
| `components/effort-dropdown/EffortDropdown.tsx` | Fix UUID display in Base UI Select controlled mode |
| `components/activity-log/ActivityLogTable.tsx` | Labels for `chore_completion_reward` and `chore_completion_reward_reversed` event types |
| `app/(admin)/admin/chores/page.tsx` | Reward Points input in Add Chore form; uses `ChoreEditForm` for edit section |
