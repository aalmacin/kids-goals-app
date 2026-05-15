# Quickstart: Fix Inconsistent Reversal

## Prerequisites

- bun
- Supabase CLI with local instance running (`supabase start`)
- Environment variables configured (`.env.local`)

## Development Flow

1. **Apply migration**: `supabase db push` or `supabase migration up` to add undo count columns
2. **Regenerate types**: `bunx supabase gen types typescript --local > lib/database.types.ts`
3. **Run dev server**: `bun dev`
4. **Run tests**: `bun vitest` (unit/integration), `bun playwright test` (E2E)

## Key Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/0015_undo_counts.sql` | New migration: add columns + update constraint |
| `lib/database.types.ts` | Regenerated from schema |
| `lib/types.ts` | Add undo count fields to DayRecord and ChoreCompletion |
| `lib/actions/day-records.ts` | Add undo limit + current-day check to `undoEndDay`; add `undoRestDay`; add uncheck limit to `toggleChore` |
| `lib/db/day-records.ts` | Add DB helpers for undo count queries |
| `components/end-day/UndoEndDayButton.tsx` | Enlarge styling, accept eligibility props |
| `components/rest-day/UndoRestDayButton.tsx` | New: undo rest day with confirmation dialog |
| `components/rest-day/RestDayButton.tsx` | Show undo option when rest day active + eligible |
| `components/chore-list/ChoreItem.tsx` | Lock checkbox when uncheck exhausted + completed |
| `app/(dashboard)/page.tsx` | Compute undo eligibility, pass to components |

## Testing

- Unit: `__tests__/unit/undo-eligibility.test.ts` — undo eligibility pure functions
- Integration: `__tests__/integration/undo-end-day.test.ts` — extend with limit tests
- Integration: `__tests__/integration/undo-rest-day.test.ts` — new
- Integration: `__tests__/integration/chore-uncheck-limit.test.ts` — new
- E2E: `__tests__/e2e/undo-end-day.spec.ts`, `undo-rest-day.spec.ts`, `chore-uncheck-limit.spec.ts`
