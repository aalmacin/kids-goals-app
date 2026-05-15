# Quickstart: Fix Inconsistent Reversal

## Prerequisites

- Node.js, pnpm
- Supabase CLI with local instance running (`supabase start`)
- Environment variables configured (`.env.local`)

## Development Flow

1. **Apply migration**: `supabase db push` or `supabase migration up` to add undo count columns
2. **Regenerate types**: `supabase gen types typescript --local > lib/database.types.ts`
3. **Run dev server**: `pnpm dev`
4. **Run tests**: `pnpm vitest` (unit/integration), `pnpm playwright test` (E2E)

## Key Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/NNNN_undo_counts.sql` | New migration adding columns and updating constraint |
| `lib/database.types.ts` | Regenerated from schema |
| `lib/types.ts` | Add undo count fields |
| `lib/actions/day-records.ts` | Add `undoEndDay`, `undoRestDay` server actions; modify `toggleChore` |
| `lib/db/day-records.ts` | Add DB helpers for undo operations |
| `components/end-day/UndoEndDayButton.tsx` | New component |
| `components/rest-day/UndoRestDayButton.tsx` | New component |
| `components/chore-list/ChoreItem.tsx` | Lock checkbox when uncheck exhausted |
| `app/(dashboard)/page.tsx` | Pass undo state to components |

## Testing

- Unit: `__tests__/unit/undo-logic.test.ts` — undo eligibility functions
- Integration: `__tests__/integration/undo-*.test.ts` — server actions with Supabase
- E2E: `__tests__/e2e/undo-*.spec.ts` — full browser flows
