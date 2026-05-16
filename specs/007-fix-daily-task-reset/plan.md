# Implementation Plan: Fix Daily Task Reset

**Branch**: `007-fix-daily-task-reset` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

## Summary

Once-per-day tasks are not resetting at midnight because `getTodayStart()` in `lib/db/tasks.ts` constructs a `Date` from `${dateStr}T00:00:00` without a timezone offset, causing JavaScript to interpret it as **server local time** (UTC in production) instead of midnight in the family's timezone. The fix corrects the offset calculation so the boundary is always midnight in the user's local timezone.

## Technical Context

**Language/Version**: TypeScript (strict mode)
**Primary Dependencies**: Next.js (App Router, Server Actions), Supabase
**Storage**: Supabase PostgreSQL (`task_completions.completed_at` — timestamptz)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Next.js server (Node.js, UTC system clock in production)
**Project Type**: Web application (full-stack)
**Performance Goals**: No change — single utility function
**Constraints**: No new dependencies; fix must be pure JS/TS using `Intl` APIs already in use
**Scale/Scope**: Single function used in 3 call sites within `lib/db/tasks.ts`

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | ✅ Pass | No API routes involved; fix is inside a DB helper |
| II. Supabase Patterns | ✅ Pass | RLS unchanged; query logic unchanged |
| III. TanStack First | ✅ Pass | No state management changes |
| IV. shadcn Components First | ✅ Pass | No UI component changes |
| V. Test Coverage | ✅ Pass | Unit test for `getTodayStart` + E2E for daily reset required |

## Project Structure

### Documentation (this feature)

```text
specs/007-fix-daily-task-reset/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output (minimal — no schema changes)
└── tasks.md             ← Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
lib/db/tasks.ts                                  ← getTodayStart() fix
__tests__/unit/task-completion-guard.test.ts     ← extend with getTodayStart tests
__tests__/e2e/repeated-task.spec.ts              ← extend with daily reset scenario
```

## Phase 0: Research

### research.md summary (inline — no external unknowns)

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Use `Intl.DateTimeFormat` with `timeZoneName: 'longOffset'` to extract the UTC offset | Already using `Intl` API; no new deps; works in Node 16+ | `temporal` polyfill (extra dep), manual offset math (error-prone), `date-fns-tz` (extra dep) |
| Fix in `getTodayStart` only — no query changes | The query already compares against a JS `Date`; only the boundary is wrong | Fixing in SQL (would require Supabase RPC, over-engineered for this bug) |
| Keep the `families.timezone` lookup unchanged | Timezone value is already stored and passed correctly | N/A |

## Phase 1: Design & Contracts

### data-model.md

No schema changes. The `task_completions.completed_at` column is already `timestamptz` (correct). The bug is purely in how the day boundary is computed in application code.

**Affected call sites** (all in `lib/db/tasks.ts`):

| Function | Line | Role of `getTodayStart` |
|----------|------|------------------------|
| `getAvailableTasksForKid` | ~63 | Filters completions to count `todayCounts` |
| `getTaskTodayCompletionCount` | ~152 | Returns count for the `completeTaskAction` guard |
| `undoLastTaskCompletion` | ~168 | Filters to only allow undo of today's completions |

### The Fix

**File**: `lib/db/tasks.ts` — `getTodayStart` function (lines 193–203)

**Current (buggy)**:
```typescript
function getTodayStart(timezone: string): Date {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const dateStr = formatter.format(now)
  return new Date(`${dateStr}T00:00:00`)
  //                              ^^^^^^^ server local time, not family timezone!
}
```

**Fixed**:
```typescript
function getTodayStart(timezone: string): Date {
  const now = new Date()
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  }).formatToParts(now)

  const tzName = tzParts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  // "GMT-04:00" → "-04:00", "GMT+05:30" → "+05:30", "GMT" → "+00:00"
  const offset = tzName === 'GMT' ? '+00:00' : tzName.slice(3)

  return new Date(`${dateStr}T00:00:00${offset}`)
}
```

**Why this works**: `dateStr` correctly gives the local calendar date in the family's timezone (e.g., "2026-05-15"). Appending the timezone offset (e.g., "-04:00") makes JavaScript parse the full ISO 8601 datetime with explicit offset, giving the exact UTC instant that represents midnight in the family's timezone.

### Contracts

No external interface changes. `getTodayStart` is a private module-level function. Server Action signatures are unchanged.

## Complexity Tracking

No violations.
