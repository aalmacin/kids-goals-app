# Quickstart: Fix Inconsistent Reversal

## Prerequisites

- bun
- Supabase CLI with local instance running (`supabase start`)
- Environment variables configured (`.env.local`)

## Development Flow

1. **Apply migrations**: `supabase db push` or `supabase migration up`
   - Migration 0015: adds `uncheck_count` to `chore_completions`
   - Migration 0016: adds `end_day(p_day_record_id uuid)` PostgreSQL function
2. **Regenerate types**: `bunx supabase gen types typescript --local > lib/database.types.ts`
3. **Run dev server**: `bun dev`
4. **Run tests**: `bun vitest` (unit/integration), `bun playwright test` (E2E)

## Key Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/0015_undo_counts.sql` | Add `uncheck_count` to `chore_completions`; add action types to constraint |
| `supabase/migrations/0016_end_day_atomic.sql` | New: `end_day` PostgreSQL function |
| `lib/database.types.ts` | Regenerated from schema |
| `lib/types.ts` | Add `uncheckCount: number` to `ChoreCompletion`; remove `EffortLevel`; remove unused `DayRecord` fields |
| `lib/undo-eligibility.ts` | `canUncheckChore` only |
| `lib/actions/day-records.ts` | `endDay` simplified — auth check + `supabase.rpc('end_day', ...)` |
| `lib/actions/tasks.ts` | Server-side day-ended guard in `completeTaskAction` |
| `components/task-list/TaskSection.tsx` | `isEnded` prop — returns null when ended |
| `components/chore-list/ChoreItem.tsx` | Lock checkbox when uncheck exhausted + completed |
| `app/(dashboard)/page.tsx` | Pass `isEnded` to `TaskSection`; remove effort level fetching |

## Removed Features

- **Undo End Day** — `UndoEndDayButton` and `undoEndDay` server action deleted
- **Undo Rest Day** — `UndoRestDayButton` and `undoRestDay` server action deleted
- **Effort Levels** — `EffortDropdown`, effort actions/db, admin effort page deleted

## Testing

- Unit: `__tests__/unit/undo-eligibility.test.ts` — `canUncheckChore`
- Integration: `__tests__/integration/chore-uncheck-limit.test.ts`
- Integration: `__tests__/integration/end-day-atomic.test.ts` — verifies atomicity via simulated constraint failure
- E2E: `__tests__/e2e/chore-uncheck-limit.spec.ts`, `task-locked-after-end-day.spec.ts`, `end-day.spec.ts`
