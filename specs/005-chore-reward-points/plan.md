# Implementation Plan: Chore Completion Reward Points

**Branch**: `005-chore-reward-points` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-chore-reward-points/spec.md`

## Summary

Adds configurable reward points to chores. Parents set a `reward_points` value on library chores; kids earn those points when they complete a chore and End Day is triggered. Points are event-sourced via `chore_completion_reward` activity log entries (one per completed rewarded chore). End Day undo inserts `chore_completion_reward_reversed` events, restoring balance via the existing trigger. Includes a bug fix for `undoEndDay` generating phantom penalty reversal events, and a bug fix for `EffortDropdown` displaying a UUID instead of the effort label text in controlled mode under Base UI's Select.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, no `any`)
**Primary Dependencies**: Next.js 16.2.4 (App Router, Server Actions), React 19, @base-ui/react 1.4.1, shadcn/ui (Radix/Tailwind conventions), TanStack Query 5, TanStack Store 0.11, TanStack Table 8
**Storage**: Supabase PostgreSQL (local instance for tests), RLS on all tables
**Testing**: Vitest (unit + integration), Playwright (E2E against seeded local Supabase)
**Target Platform**: Web (PWA via serwist)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Balance updates within 2 seconds of End Day (SC-002); event-sourced trigger handles recalculation automatically
**Constraints**: No API routes for data — Server Actions only; bun for all package/script commands; TypeScript strict mode throughout
**Scale/Scope**: Family-scale (small number of kids and chores per family)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns (Server Actions, no API routes for data) | PASS | `endDay` and `undoEndDay` are Server Actions in `lib/actions/day-records.ts`; no new API routes introduced |
| II. Supabase Patterns (RLS, typed client, Realtime) | PASS | All DB access via typed Supabase client; RLS already enforced on all tables; no Edge Functions introduced |
| III. TanStack First | PASS | No new client state introduced; existing TanStack Query usage unmodified |
| IV. shadcn Components First | PASS | `EffortDropdown` uses shadcn `Select` wrapper (which wraps `@base-ui/react/select`); no custom primitives introduced |
| V. Test Coverage | PASS | Unit tests for `calculateChoreRewards`; integration tests for `endDay` / `undoEndDay`; E2E test for full reward flow |

## Project Structure

### Documentation (this feature)

```text
specs/005-chore-reward-points/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── (admin)/admin/chores/page.tsx      # Reward Points field in Add Chore form
├── (admin)/admin/effort/page.tsx      # Effort levels admin (pre-existing)

components/
├── chore-list/ChoreItem.tsx           # +N pts reward badge on chore tiles
├── activity-log/ActivityLogTable.tsx  # chore_completion_reward[_reversed] labels
├── effort-dropdown/EffortDropdown.tsx # Bug fix: UUID → label display
├── end-day/EndDayButton.tsx           # Passes effortLevels to EffortDropdown
└── ui/select.tsx                      # shadcn Select (wraps @base-ui/react/select)

lib/
├── types.ts                           # Chore.reward, ChoreCompletion.rewardSnapshot, new action types
├── points.ts                          # calculateChoreRewards()
├── database.types.ts                  # Generated types updated for new columns
├── db/chores.ts                       # createChore/updateChore accept reward
├── db/day-records.ts                  # getOrCreateDayRecord seeds reward_snapshot
└── actions/
    ├── chores.ts                      # createChoreAction/updateChoreAction read reward from formData
    └── day-records.ts                 # endDay inserts chore_completion_reward; undoEndDay reverses

supabase/migrations/
├── 0011_chore_reward_points.sql       # reward_points on chores, reward_snapshot on chore_completions
└── 0012_reward_reversal_event_type.sql # chore_completion_reward_reversed action type

__tests__/
├── unit/points.test.ts                # calculateChoreRewards unit tests
├── integration/
│   ├── chores.test.ts                 # reward_points persistence
│   └── day-records.test.ts            # endDay rewards + undoEndDay reversal + phantom fix
└── e2e/us11-chore-reward.spec.ts      # Full reward flow E2E + undo path
```

**Structure Decision**: Single Next.js application (monorepo root). No new directories — all changes extend existing `lib/`, `components/`, `app/`, and `supabase/migrations/` patterns.

## Complexity Tracking

No constitution violations. All changes follow established patterns (snapshot columns, Server Actions, event-sourced balance, shadcn components).

---

## Phase 0: Research

See [research.md](./research.md) for full decisions. Key decisions:

| Decision | Choice |
|----------|--------|
| When rewards granted | End Day only (mirrors penalty timing) |
| Granularity | One `chore_completion_reward` event per completed chore with reward > 0 |
| Snapshot strategy | `reward_snapshot` on `chore_completions`, captured at day-record creation |
| Balance update | Existing `after_activity_log_insert` trigger handles it — no manual update needed |
| Undo strategy | One `chore_completion_reward_reversed` per original reward event; only reverse events that actually exist (FR-013) |
| EffortDropdown display bug | Base UI `Select.Value` in controlled mode cannot resolve UUID → label from items that haven't been rendered in an active popup; fix by deriving display label from `effortLevels` prop directly in `EffortDropdown` |

---

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md) for entity definitions, migration SQL, and state transition diagrams.

### EffortDropdown Bug Fix (FR-014)

**Root cause**: `components/ui/select.tsx` wraps `@base-ui/react/select` (Base UI), not Radix UI. Base UI's `Select.Value` displays the selected item's label by reading from an internal context that is populated when the user interacts with the popup. In controlled mode, when `value` is set externally to a UUID string (e.g., from `useState`), Base UI has no popup-rendered items to read the label from, so it falls back to rendering the raw `value` string — the UUID.

**Fix**: In `EffortDropdown`, look up the selected `EffortLevel` from the `effortLevels` prop using the current `value` UUID, and render the label string directly inside `SelectValue` as children. This bypasses Base UI's internal label-resolution mechanism entirely:

```tsx
const selectedLevel = effortLevels.find((l) => l.id === value) ?? null

<SelectTrigger className="w-full">
  <SelectValue placeholder="Select effort level...">
    {selectedLevel ? `${selectedLevel.name} (+${selectedLevel.points} pts)` : undefined}
  </SelectValue>
</SelectTrigger>
```

**No schema changes required** — this is a purely presentational fix in `EffortDropdown.tsx`.

**Affected file**: `components/effort-dropdown/EffortDropdown.tsx`
