# Research: Fix Daily Task Reset

## Root Cause Analysis

**Bug**: `getTodayStart(timezone)` in `lib/db/tasks.ts` constructs midnight as `new Date(`${dateStr}T00:00:00`)`. JavaScript parses a datetime string without a timezone offset using the **engine's local clock** (UTC in production Node.js). This means "midnight" is UTC midnight, not midnight in the family's timezone.

**Example**:
- Family timezone: `America/New_York` (UTC-4 in EDT)
- Task completed at 10 PM May 14 New York time = `2026-05-15T02:00:00Z` in DB
- Next morning (8 AM May 15 New York) — `getTodayStart("America/New_York")`:
  - `dateStr` = `"2026-05-15"` ✓ (correctly computed in NY timezone)
  - `new Date("2026-05-15T00:00:00")` = `2026-05-15T00:00:00Z` (server/UTC midnight) ✗
  - Correct value should be `2026-05-15T04:00:00Z` (midnight in NY = 4 AM UTC)
- Check: `2026-05-15T02:00:00Z >= 2026-05-15T00:00:00Z` → **true** (bug: counted as "today")
- Correct check: `2026-05-15T02:00:00Z >= 2026-05-15T04:00:00Z` → **false** (available again ✓)

## Fix Decision

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Extract UTC offset via `Intl.DateTimeFormat` with `timeZoneName: 'longOffset'` | No new dependencies; `Intl` already in use; Node 16+ supported | `temporal` polyfill (extra dep), `date-fns-tz` (extra dep), manual offset arithmetic (fragile) |
| Append offset to ISO 8601 string: `${dateStr}T00:00:00${offset}` | Standard ISO 8601 with offset is unambiguous; JS Date parses it correctly | Converting to UTC manually by subtracting offset ms (more steps, more error surface) |
| Fix in `getTodayStart` only | Single fix point; all 3 call sites are corrected automatically | Fixing each call site individually (more changes, risk of missing one) |

## Affected Call Sites

All fixed automatically by correcting `getTodayStart`:

1. `getAvailableTasksForKid` — filters `todayCounts`
2. `getTaskTodayCompletionCount` — used by `completeTaskAction` guard
3. `undoLastTaskCompletion` — limits undo to same-day completions

## Test Plan

| Layer | Test | File |
|-------|------|------|
| Unit | `getTodayStart` returns correct UTC midnight for positive/negative/fractional offsets and UTC | `__tests__/unit/task-completion-guard.test.ts` |
| E2E | Complete a once-per-day task; simulate next day; verify task is available again | `__tests__/e2e/repeated-task.spec.ts` |
