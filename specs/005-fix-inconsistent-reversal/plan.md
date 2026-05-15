# Implementation Plan: Fix Inconsistent Reversal

**Branch**: `005-fix-inconsistent-reversal` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-fix-inconsistent-reversal/spec.md`

## Summary

Add consistent one-undo-per-day limits to existing reversal actions and implement missing undo flows. The `undoEndDay` server action and `UndoEndDayButton` component already exist but lack the one-undo limit and current-day restriction. Chore unchecking is currently unlimited and needs a one-undo-per-day cap. Undo rest day is not yet implemented. Task undo is explicitly out of scope.

## What Already Exists

| Feature | Status | What's Missing |
|---------|--------|----------------|
| Undo End Day action | Implemented (`lib/actions/day-records.ts:undoEndDay`) | No undo count limit, no current-day check |
| UndoEndDayButton | Implemented (`components/end-day/UndoEndDayButton.tsx`) | Small styling, always shown when ended |
| Reversal action types | Migrated (`0010_undo_end_day.sql`) | None — `day_undone`, `penalty_reversed`, `effort_reversed`, `chore_completion_reward_reversed` all exist |
| Chore toggle | Implemented (`toggleChore`) | No uncheck_count tracking or limit |
| Undo rest day | Not implemented | Entire flow needed |
| Task undo | Implemented (separate system) | Out of scope — no changes |

## Technical Context

**Language/Version**: TypeScript (strict mode)
**Primary Dependencies**: Next.js (App Router, Server Actions), Supabase (Auth, PostgreSQL, Realtime), shadcn/ui, TanStack Store
**Storage**: Supabase PostgreSQL with RLS
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (PWA)
**Project Type**: Web application (Next.js)
**Package Manager**: bun
**Constraints**: All mutations via Server Actions. Event-sourced points via activity_log trigger. No API routes for data.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | PASS | All mutations use Server Actions. No new API routes. |
| II. Supabase Patterns | PASS | New columns on RLS-protected tables. Points via activity_log trigger. |
| III. TanStack First | PASS | No new client state. Dashboard is server-rendered. |
| IV. shadcn Components First | PASS | Undo buttons use existing AlertDialog + Button from shadcn/ui. |
| V. Test Coverage | PASS | Unit tests for undo eligibility, integration tests for server actions, E2E for all undo flows. |

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-inconsistent-reversal/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code Changes

```text
supabase/migrations/
└── 0015_undo_counts.sql                    # New: add undo_end_count, undo_rest_day_count, uncheck_count; add rest_day_reversed action type

lib/
├── actions/day-records.ts                   # Modified: add undo limit + current-day checks to undoEndDay, add undoRestDay, add uncheck_count enforcement to toggleChore
├── db/day-records.ts                        # Modified: add helpers for undo count queries
├── types.ts                                 # Modified: add undo count fields to DayRecord and ChoreCompletion
├── database.types.ts                        # Regenerated from schema

components/
├── end-day/UndoEndDayButton.tsx             # Modified: larger styling, conditionally rendered based on undo eligibility
├── rest-day/RestDayButton.tsx               # Modified: show undo rest day option when active and eligible
├── rest-day/UndoRestDayButton.tsx           # New: undo rest day with confirmation dialog
├── chore-list/ChoreItem.tsx                 # Modified: lock checkbox when uncheck exhausted and completed

app/(dashboard)/page.tsx                     # Modified: compute undo eligibility, pass props

__tests__/
├── unit/undo-eligibility.test.ts            # New: unit tests for undo eligibility logic
├── integration/undo-end-day.test.ts         # Existing — extend with undo limit and current-day tests
├── integration/undo-rest-day.test.ts        # New: integration tests for undo rest day
├── integration/chore-uncheck-limit.test.ts  # New: integration tests for chore uncheck limit
├── e2e/undo-end-day.spec.ts                 # New: E2E for undo end day (limit + current-day restriction)
├── e2e/undo-rest-day.spec.ts               # New: E2E for undo rest day flow
└── e2e/chore-uncheck-limit.spec.ts         # New: E2E for chore uncheck limit
```

**Structure Decision**: Follows existing project layout. New UndoRestDayButton is co-located with RestDayButton in `components/rest-day/`.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
