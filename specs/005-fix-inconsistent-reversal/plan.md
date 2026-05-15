# Implementation Plan: Fix Inconsistent Reversal

**Branch**: `005-fix-inconsistent-reversal` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-fix-inconsistent-reversal/spec.md`

## Summary

Add consistent one-undo-per-day reversal for three actions: ending a day, unchecking a chore completion, and undoing a rest day purchase. Each action tracks its undo count in the database and inserts reversal activity log entries to maintain the event-sourcing audit trail. Points are recalculated automatically via the existing `recalculate_kid_points` trigger.

## Technical Context

**Language/Version**: TypeScript (strict mode)
**Primary Dependencies**: Next.js (App Router, Server Actions), Supabase (Auth, PostgreSQL, Realtime), shadcn/ui, TanStack Store
**Storage**: Supabase PostgreSQL with RLS
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (PWA)
**Project Type**: Web application (Next.js)
**Performance Goals**: Standard web app (<3s page load)
**Constraints**: All mutations via Server Actions (no API routes). Event-sourced points via activity_log trigger.
**Scale/Scope**: Family-sized user base (small scale)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | PASS | All mutations use Server Actions. No new API routes. CSP nonce unaffected. |
| II. Supabase Patterns | PASS | New columns use RLS-protected tables. Points via activity_log trigger. No Edge Functions. |
| III. TanStack First | PASS | No new client state beyond existing patterns. Dashboard is server-rendered. |
| IV. shadcn Components First | PASS | Undo buttons use existing AlertDialog and Button from shadcn/ui. |
| V. Test Coverage | PASS | Plan includes unit tests for undo logic, integration tests for server actions/RLS, and E2E tests for undo flows. |

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

### Source Code (repository root)

```text
supabase/migrations/
└── NNNN_undo_counts.sql          # New migration: add undo count columns

lib/
├── actions/day-records.ts         # Modified: add undoEndDay, undoRestDay actions; guard toggleChore with uncheck_count
├── db/day-records.ts              # Modified: add undo query helpers
├── types.ts                       # Modified: add undo count fields to DayRecord and ChoreCompletion types
├── database.types.ts              # Regenerated: reflects new columns
└── points.ts                      # No changes needed

components/
├── end-day/EndDayButton.tsx       # Modified: show Undo End Day button when applicable
├── end-day/UndoEndDayButton.tsx   # New: undo end-day with confirmation dialog
├── rest-day/RestDayButton.tsx     # Modified: show Undo Rest Day button when applicable
├── rest-day/UndoRestDayButton.tsx # New: undo rest-day with confirmation dialog
└── chore-list/ChoreItem.tsx       # Modified: lock checkbox when uncheck_count >= 1 and completed

app/(dashboard)/page.tsx           # Modified: pass undo state props to components

__tests__/
├── unit/undo-logic.test.ts        # New: unit tests for undo eligibility logic
├── integration/undo-end-day.test.ts   # New: integration tests for undo end-day action
├── integration/undo-rest-day.test.ts  # New: integration tests for undo rest-day action
├── integration/chore-uncheck-limit.test.ts # New: integration tests for chore uncheck limit
├── e2e/undo-end-day.spec.ts      # New: E2E test for undo end-day flow
├── e2e/undo-rest-day.spec.ts     # New: E2E test for undo rest-day flow
└── e2e/chore-uncheck-limit.spec.ts # New: E2E test for chore uncheck limit
```

**Structure Decision**: Follows existing project layout. New components are co-located with their related existing components (end-day/, rest-day/). Undo buttons are separate components to keep EndDayButton and RestDayButton focused.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
