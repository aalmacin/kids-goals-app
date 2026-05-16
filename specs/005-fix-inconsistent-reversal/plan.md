# Implementation Plan: Fix Inconsistent Reversal

**Branch**: `005-fix-inconsistent-reversal` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-fix-inconsistent-reversal/spec.md`
**User guidance**: Chore uncheck limits, hide tasks after End Day, End Day atomicity via PostgreSQL RPC

## Summary

Three changes shipped in this branch:

1. **Chore uncheck limit** — one uncheck per chore per day; checkbox locks after re-completion.
2. **Tasks hidden after End Day** — `TaskSection` hides when `isEnded`; server-side guard in `completeTaskAction`.
3. **End Day atomicity** — `endDay` server action replaced with a `supabase.rpc('end_day', ...)` call backed by a PostgreSQL function that writes penalty, chore rewards, `ended_at`, and `day_ended` log entry in a single implicit transaction. Partial failure is impossible.

Undo End Day, Undo Rest Day, and Effort Levels were removed (see spec.md).

## Technical Context

**Language/Version**: TypeScript (strict mode, no `any`)
**Primary Dependencies**: Next.js App Router, Supabase, shadcn/ui, TanStack Query/Store
**Storage**: PostgreSQL via Supabase (RLS-enforced)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (Next.js app)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Standard SSR response times; single RPC replaces 4–6 round-trips for End Day
**Constraints**: No client-side transactions; atomicity requires PostgreSQL function via `supabase.rpc()`
**Scale/Scope**: Single-family app; one kid's dashboard per session

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | PASS | `endDay` remains a server action; no new API routes |
| II. Supabase Patterns | PASS | RPC via typed Supabase client; no Edge Functions |
| III. TanStack First | PASS | No new client state |
| IV. shadcn Components First | PASS | No new components |
| V. Test Coverage | PASS | Integration test for atomicity; E2E for end-day flow |

No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-inconsistent-reversal/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (relevant files)

```text
supabase/migrations/0016_end_day_atomic.sql       # New: end_day() PL/pgSQL function
lib/actions/day-records.ts                        # endDay → thin auth wrapper + supabase.rpc()
lib/actions/tasks.ts                              # completeTaskAction day-ended guard
components/task-list/TaskSection.tsx              # isEnded prop
components/chore-list/ChoreItem.tsx               # lock checkbox when uncheck exhausted
app/(dashboard)/page.tsx                          # wire isEnded to TaskSection
__tests__/integration/end-day-atomic.test.ts      # atomicity integration test
__tests__/e2e/end-day.spec.ts                     # E2E: end day happy path
```

---

## Phase 0: Research

### Finding 1 — No multi-statement transaction API in Supabase JS client

Supabase's REST client sends each `insert`/`update` as a separate HTTP request. There is no `BEGIN/COMMIT` wrapper. A partial failure between writes leaves the DB in an inconsistent state.

**Fix**: Extract all `endDay` writes into a PostgreSQL function. PostgreSQL wraps PL/pgSQL functions in an implicit transaction — any `RAISE EXCEPTION` rolls back all statements executed so far in that call.

### Finding 2 — Existing precedent: `apply_points_delta`

Migration 0003 already uses a `SECURITY DEFINER` PL/pgSQL function for the points update. The same pattern applies here. `auth.uid()` is available inside `SECURITY DEFINER` functions in Supabase because the request JWT is set via `set_config` before the function executes.

### Finding 3 — Penalty and reward logic is simple SQL

`calculatePenalties`: `SUM(penalty_snapshot) WHERE completed_at IS NULL AND (NOT is_rest_day OR is_important)`.
`calculateChoreRewards`: rows `WHERE completed_at IS NOT NULL AND reward_snapshot > 0`.

Both are straightforward SQL — no special operators. The TypeScript helpers remain for display/testing; the DB function reimplements them in SQL for atomicity.

---

## Phase 1: Design

### Data model changes

New migration `0016_end_day_atomic.sql` — adds PostgreSQL function `end_day(p_day_record_id uuid) RETURNS jsonb`.

See [data-model.md](./data-model.md) for the full function definition.

### Contracts

`endDay(dayRecordId: string)` server action — external signature unchanged. Internally replaces sequential writes with `supabase.rpc('end_day', { p_day_record_id: dayRecordId })`.

On RPC error: server action throws, Next.js surfaces error to client.
On RPC success: returns `{ success: true }` as before.

### Implementation design

#### 1. `supabase/migrations/0016_end_day_atomic.sql`

New PL/pgSQL function (see data-model.md for full body):

- Validates caller owns the day record via `auth.uid()` → raises exception if not found/authorized
- Idempotent check: if `ended_at IS NOT NULL`, returns `{ success: true }` immediately
- Calculates and inserts `penalty_applied` activity_log entry (if penalty > 0)
- Loops over rewarded completions, inserts one `chore_completion_reward` entry each
- Updates `day_records.ended_at = now()`
- Inserts `day_ended` activity_log entry
- All writes in a single implicit transaction — any failure rolls everything back

#### 2. `lib/actions/day-records.ts` — `endDay`

Replace the multi-write body with a thin wrapper:

```ts
export async function endDay(dayRecordId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.rpc('end_day', { p_day_record_id: dayRecordId })
  if (error) throw new Error(error.message)

  revalidatePath('/')
  return { success: true }
}
```

The auth check (`getUser`) stays in the server action as a fast-fail before the DB round-trip. The function itself also validates ownership internally.

#### 3. Regenerate `lib/database.types.ts`

Run `bunx supabase gen types typescript --local` after applying migration 0016 so `supabase.rpc('end_day', ...)` is fully typed.

---

## Post-Design Constitution Check

| Principle | Status |
|-----------|--------|
| I. Next.js Patterns | PASS — server action calls RPC; no API routes |
| II. Supabase Patterns | PASS — typed `supabase.rpc()`; SECURITY DEFINER follows existing pattern |
| III. TanStack First | PASS — no new state |
| IV. shadcn Components First | PASS — no UI changes |
| V. Test Coverage | PASS — integration test validates atomicity; E2E covers happy path |
