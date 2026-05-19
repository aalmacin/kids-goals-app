# Implementation Plan: Fix Inconsistent Reversal

**Branch**: `005-add-missing-edits` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-fix-inconsistent-reversal/spec.md`

## Summary

Enforce a one-undo-per-day limit on chore unchecking, hide the Tasks section after End Day, block task completion server-side after End Day, and wrap End Day's multi-write sequence in a PostgreSQL atomic function.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 16.2.4 (App Router, Server Actions), Supabase JS v2, TanStack Query v5, TanStack Store, shadcn/ui, Playwright, Vitest
**Storage**: PostgreSQL via Supabase (RLS enabled)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web — Next.js App Router, deployed via Vercel/Supabase
**Project Type**: Web application (full-stack, monorepo)
**Performance Goals**: No new latency requirements; DB migration adds a single integer column and a PL/pgSQL function
**Constraints**: End Day must be atomic — partial failure must roll back all writes
**Scale/Scope**: Single-family use; no concurrency concerns for undo limit

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns (no API routes for mutations) | PASS | All mutations are Server Actions; `end_day` uses `supabase.rpc()` |
| II. Supabase Patterns (RLS, no Edge Functions) | PASS | New DB function uses SECURITY DEFINER + caller verification; no Edge Functions |
| III. TanStack First | PASS | No new client state; existing TanStack Query cache invalidation applies |
| IV. shadcn Components First | PASS | Checkbox locking uses existing shadcn Checkbox disabled state |
| V. Test Coverage (E2E tasks mandatory) | PASS | E2E tasks are included in tasks.md for all three user stories |

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-inconsistent-reversal/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   └── page.tsx                          # Pass isEnded to TaskSection; remove effort level fetching
├── actions/                              # (no new files; modified below)
│   └── ...

lib/
├── actions/
│   ├── day-records.ts                    # endDay simplified — auth check + supabase.rpc('end_day', ...)
│   └── tasks.ts                          # completeTaskAction — server-side day-ended guard
├── database.types.ts                     # Regenerated from schema
├── types.ts                              # Add uncheckCount; remove EffortLevel; remove unused DayRecord fields
├── undo-eligibility.ts                   # canUncheckChore — returns false if uncheck_count > 0

components/
├── chore-list/
│   └── ChoreItem.tsx                     # Disable checkbox when uncheck exhausted + completed
├── task-list/
│   └── TaskSection.tsx                   # Return null when isEnded prop is true

supabase/migrations/
├── 0015_undo_counts.sql                  # Add uncheck_count to chore_completions; update action_type constraint
└── 0016_end_day_atomic.sql              # Create end_day(p_day_record_id uuid) PL/pgSQL function

__tests__/
├── unit/
│   └── undo-eligibility.test.ts          # canUncheckChore
├── integration/
│   ├── chore-uncheck-limit.test.ts
│   └── end-day-atomic.test.ts            # Verifies rollback on simulated constraint failure
└── e2e/
    ├── chore-uncheck-limit.spec.ts
    ├── task-locked-after-end-day.spec.ts
    └── end-day.spec.ts
```

**Structure Decision**: Single Next.js App Router project. All server logic lives in `lib/actions/`; UI components in `components/`; DB schema in `supabase/migrations/`.

## Removed Features

These are deleted as part of this feature branch (not merely disabled):

| Item | Files / Artifacts |
|------|-------------------|
| Undo End Day | `UndoEndDayButton` component, `undoEndDay` server action |
| Undo Rest Day | `UndoRestDayButton` component, `undoRestDay` server action |
| Effort Levels | `EffortDropdown`, `edit-effort-level-dialog.tsx`, effort DB actions, admin effort page |

## Complexity Tracking

> No constitution violations.
