# Implementation Plan: Chore Completion Reward Points

**Branch**: `005-chore-reward-points` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-chore-reward-points/spec.md`

## Summary

Add a `reward_points` field to the chore library that kids earn at End Day for each completed chore (mirroring how penalties work). Rewards are granted via the existing event-sourced activity log (new `chore_completion_reward` event type, one per completed rewarded chore), surfaced on the kid dashboard chore tile (shown on both completed and uncompleted tiles) and parent activity log. No reward reversal on toggle — unchecking before End Day simply means no reward is granted.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, no `any`)
**Primary Dependencies**: Next.js 16.2.4 (App Router, Server Actions), Supabase JS v2, TanStack Query v5, TanStack Table v8, shadcn/ui (Radix + Tailwind v4)
**Storage**: Supabase PostgreSQL (RLS enabled), event-sourced via `activity_log` trigger
**Testing**: Vitest (unit + integration against local Supabase), Playwright (E2E)
**Target Platform**: Web PWA (Next.js)
**Project Type**: Full-stack web application
**Performance Goals**: Balance update reflected within 2 seconds of End Day completing (SC-002)
**Constraints**: No new `/api` routes; all mutations via Server Actions; no Supabase Edge Functions
**Scale/Scope**: Single-family household; small data volumes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns — Server Actions, no `/api` for data | ✅ Pass | Reward grant logic added to existing `endDay` Server Action |
| II. Supabase Patterns — RLS, typed client, Realtime | ✅ Pass | New columns under existing RLS; Realtime subscription on `activity_log` already handles balance refresh |
| III. TanStack First — Query, Store, Table | ✅ Pass | No new client state management; `ActivityLogTable` uses TanStack Table |
| IV. shadcn Components First | ✅ Pass | Reward badge uses existing `Badge`; chore form uses existing `Input`/`Label` |
| V. Test Coverage — E2E happy + failure, unit for business logic, integration for RLS | ✅ Pass | New unit tests for reward calculation, integration for schema + End Day flow, E2E for full reward flow |

## Project Structure

### Documentation (this feature)

```text
specs/005-chore-reward-points/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (changed files)

```text
supabase/migrations/
└── 0007_chore_reward_points.sql    # new: schema changes

lib/
├── types.ts                         # update: Chore, ChoreCompletion, ActivityLogEntry
├── points.ts                        # update: add calculateChoreRewards
├── db/
│   ├── chores.ts                    # update: createChore, updateChore accept reward
│   └── day-records.ts               # update: seed reward_snapshot in completions
└── actions/
    ├── chores.ts                    # update: read reward from formData
    └── day-records.ts               # update: endDay grants reward events per completed chore

components/
├── chore-list/
│   └── ChoreItem.tsx                # update: show +N reward badge on both completed/uncompleted
└── activity-log/
    └── ActivityLogTable.tsx         # update: label chore_completion_reward events

app/(admin)/admin/chores/
└── page.tsx                         # update: add Reward Points input to form

__tests__/
├── unit/
│   └── points.test.ts               # update: add calculateChoreRewards tests
├── integration/
│   ├── chores.test.ts               # update: test reward_points field
│   └── day-records.test.ts          # update: test reward events on endDay
└── e2e/
    └── us11-chore-reward.spec.ts    # new: E2E for full reward flow
```

**Structure Decision**: Next.js App Router project with flat `lib/`, `components/`, `app/` layout. No new top-level directories needed — all changes are additive modifications to existing files plus one new migration and one new E2E test file.

## Complexity Tracking

> No constitution violations.
