# Implementation Plan: Chore Day Scheduling

**Branch**: `005-schedule-chore-days` | **Date**: 2026-05-03 | **Spec**: [spec.md](./spec.md)

## Summary

Add per-chore day-of-week scheduling so parents can restrict which days a chore can be worked on. The schedule is stored as a `smallint[]` column on the existing `chores` table. Schedule enforcement happens server-side in the `toggleChore` action and during `chore_completions` seeding in `getOrCreateDayRecord`. The kid-facing chore list filters unavailable chores visually and shows the next available day.

## Technical Context

**Language/Version**: TypeScript 5 — strict mode, no `any`, no `@ts-ignore` without comment
**Primary Dependencies**: Next.js 16.2.4, Supabase JS v2, TanStack Query v5, TanStack Store v0.7, shadcn/ui
**Storage**: Supabase PostgreSQL — adds `allowed_days smallint[]` to `chores`; adds `timezone text` to `families`
**Testing**: Vitest (unit + integration against local Supabase), Playwright (E2E)
**Target Platform**: PWA — iOS Safari, Android Chrome, desktop browsers
**Project Type**: Web application (Next.js App Router) — additive feature to existing app
**Performance Goals**: Schedule check adds negligible latency (in-process array lookup)
**Constraints**: Server-side enforcement required (FR-008); existing chores without schedule stay always-available (backward compatible)
**Scale/Scope**: O(7) days per schedule; O(50) chores per family; no new tables required

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns — nonce CSP via proxy.ts | PASS | No changes to CSP; additive feature only |
| I. Next.js Patterns — no API routes for data | PASS | New schedule actions use Server Actions only |
| II. Supabase — RLS on all tables | PASS | `chores` table RLS already covers `allowed_days` column; `families` timezone column covered by existing RLS |
| II. Supabase — Auth for both account types | PASS | No auth changes; parent writes schedule, kid reads via existing RLS |
| II. Supabase — Realtime for live data | PASS | No new realtime subscriptions needed; schedule is static config |
| II. Supabase — no Edge Functions | PASS | All logic in Server Actions and pure utilities |
| III. TanStack First — Query for server state | PASS | Schedule data flows through existing TanStack Query wrappers |
| III. TanStack First — Store for UI state | PASS | Day-selector UI state managed via TanStack Store |
| IV. shadcn Components First | PASS | Day-of-week selector built from shadcn Toggle/ToggleGroup primitives |
| V. Test Coverage — Playwright E2E | PASS | E2E tests for all 3 user stories |
| V. Test Coverage — Vitest unit | PASS | Unit tests for `chore-schedule.ts` pure functions |
| V. Test Coverage — Integration RLS + actions | PASS | Integration tests for schedule enforcement in `toggleChore` |

**No violations. All gates pass.**

## Project Structure

### Documentation (this feature)

```text
specs/005-schedule-chore-days/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260503000000_add_chore_allowed_days.sql   # NEW: adds allowed_days + families.timezone

lib/
├── chore-schedule.ts        # NEW: pure functions — isChoreAvailableOn, getNextAvailableDay
├── types.ts                 # MODIFIED: Chore gains allowedDays; Family gains timezone
├── db/
│   ├── chores.ts            # MODIFIED: createChore/updateChore accept allowedDays
│   └── day-records.ts       # MODIFIED: seed only schedule-available chores; check on toggle
├── actions/
│   ├── chores.ts            # MODIFIED: createChoreAction/updateChoreAction pass allowedDays
│   └── day-records.ts       # MODIFIED: toggleChore validates schedule before completing

app/(admin)/admin/chores/
└── page.tsx                 # MODIFIED: add day-of-week schedule editor per chore

components/
└── chore-list/              # MODIFIED: ChoreItem shows unavailable state + next available day

__tests__/
├── unit/
│   └── chore-schedule.test.ts        # NEW: isChoreAvailableOn, getNextAvailableDay
├── integration/
│   └── chore-schedule.test.ts        # NEW: RLS + toggleChore schedule enforcement
└── e2e/
    └── us-chore-schedule.spec.ts     # NEW: all 3 user stories happy + failure paths
```

**Structure Decision**: Additive changes only. No new route groups or top-level directories needed. Schedule logic extracted to `lib/chore-schedule.ts` as pure functions for easy unit testing (mirrors the pattern in `lib/points.ts`).

## Complexity Tracking

No constitution violations requiring justification.
