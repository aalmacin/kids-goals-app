# Quickstart: Fix Inconsistent Reversal

## Prerequisites

- bun
- Supabase CLI with local instance running (`supabase start`)
- Environment variables configured (`.env.local`)

## Development Flow

1. **Apply migration**: `supabase db push` or `supabase migration up` to add `uncheck_count` column
2. **Regenerate types**: `bunx supabase gen types typescript --local > lib/database.types.ts`
3. **Run dev server**: `bun dev`
4. **Run tests**: `bun vitest` (unit/integration), `bun playwright test` (E2E)

## Key Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/0015_undo_counts.sql` | Add `uncheck_count` to `chore_completions`; add `rest_day_reversed` to action_type constraint |
| `lib/database.types.ts` | Regenerated from schema |
| `lib/types.ts` | Add `uncheckCount: number` to `ChoreCompletion`; remove `EffortLevel` type; remove `undoEndCount`/`undoRestDayCount`/`effortLevelId` from `DayRecord` |
| `lib/undo-eligibility.ts` | `canUncheckChore` only (undo end/rest day removed) |
| `lib/actions/day-records.ts` | Uncheck limit in `toggleChore`; `endDay` simplified (no effort param) |
| `lib/actions/tasks.ts` | Server-side day-ended guard in `completeTaskAction` |
| `components/task-list/TaskSection.tsx` | `isEnded` prop — returns null when ended |
| `components/chore-list/ChoreItem.tsx` | Lock checkbox when uncheck exhausted + completed |
| `app/(dashboard)/page.tsx` | Pass `isEnded` to `TaskSection`; remove effort level fetching |

## Removed Features

- **Undo End Day** — `UndoEndDayButton` component and `undoEndDay` server action deleted
- **Undo Rest Day** — `UndoRestDayButton` component and `undoRestDay` server action deleted
- **Effort Levels** — `EffortDropdown`, `lib/actions/effort-levels.ts`, `lib/db/effort-levels.ts`, `app/(admin)/admin/effort/` all deleted

## Testing

- Unit: `__tests__/unit/undo-eligibility.test.ts` — `canUncheckChore` only
- Integration: `__tests__/integration/chore-uncheck-limit.test.ts`
- E2E: `__tests__/e2e/chore-uncheck-limit.spec.ts`, `task-locked-after-end-day.spec.ts`
