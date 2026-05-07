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

## Key Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/0007_chore_reward_points.sql` | Schema: `reward_points` on chores, `reward_snapshot` on chore_completions, updated constraint |
| `lib/types.ts` | `Chore.reward`, `ChoreCompletion.rewardSnapshot`, `chore_completion_reward` action type |
| `lib/points.ts` | `calculateChoreRewards(completions)` helper |
| `lib/db/chores.ts` | `createChore` / `updateChore` accept `reward` |
| `lib/db/day-records.ts` | Seed `reward_snapshot` when creating completions |
| `lib/actions/chores.ts` | Read `reward` from formData |
| `lib/actions/day-records.ts` | `endDay` inserts `chore_completion_reward` per completed rewarded chore |
| `components/chore-list/ChoreItem.tsx` | Show `+N pts` reward badge on both completed and uncompleted tiles |
| `components/activity-log/ActivityLogTable.tsx` | Label for `chore_completion_reward` event type |
| `app/(admin)/admin/chores/page.tsx` | Reward Points input in Add Chore form and chore list display |
