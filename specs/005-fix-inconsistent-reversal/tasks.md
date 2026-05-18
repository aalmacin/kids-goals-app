# Tasks: Fix Inconsistent Reversal

**Input**: Design documents from `specs/005-fix-inconsistent-reversal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: E2E tests are MANDATORY (Principle V). Unit tests included where business logic requires coverage.

> **Note (2026-05-16)**: Tasks T007–T011 (Undo End Day), T017–T022 (Undo Rest Day), and T025 (`canUndoRestDay` fix) were removed — Undo End Day and Undo Rest Day features are no longer built. T023 (activity log labels for `rest_day_reversed`) was removed as the button is gone. Effort Levels (referenced in T003, T030) were also removed entirely.

---

## Phase 1: Setup

**Purpose**: Database migration and type updates

- [x] T001 Create migration `supabase/migrations/0015_undo_counts.sql` — add `undo_end_count` and `undo_rest_day_count` to `day_records` (retained in schema; not used by app); add `uncheck_count` to `chore_completions`; update `activity_log_action_type_check` constraint to include `rest_day_reversed`
- [x] T002 Regenerate `lib/database.types.ts` from local Supabase schema (`bunx supabase gen types typescript --local`)
- [x] T003 Update `lib/types.ts` — add `uncheckCount: number` to `ChoreCompletion` type; add `'day_undone' | 'penalty_reversed' | 'rest_day_reversed'` to `ActivityLogEntry.actionType` union; remove `EffortLevel` type; remove `undoEndCount`, `undoRestDayCount`, `effortLevelId` from `DayRecord`

**Checkpoint**: Schema updated, types regenerated

---

## Phase 2: Foundational

**Purpose**: DB helper functions and undo eligibility logic

- [x] T004 [P] Add undo eligibility pure function `canUncheckChore(completion, isEnded)` in `lib/undo-eligibility.ts`
- [x] T005 [P] Update `lib/db/day-records.ts` — map `uncheck_count` in chore completion queries
- [x] T006 [P] Write unit tests in `__tests__/unit/undo-eligibility.test.ts` for `canUncheckChore`

**Checkpoint**: Foundation ready — chore eligibility logic testable

---

## ~~Phase 3: Undo End Day~~ — REMOVED

Tasks T007–T011 removed. End Day is a permanent terminal action.

---

## Phase 4: Chore Uncheck Limit

**Goal**: Limit chore unchecking to once per chore per day. After one uncheck and re-complete, checkbox locks.

**Independent Test**: Complete a chore, uncheck it, re-complete it — checkbox should be locked.

- [x] T012 Modify `toggleChore` in `lib/actions/day-records.ts` — when `completed=false`, check `uncheck_count == 0`; if > 0, throw error; on successful uncheck, increment `uncheck_count` and insert an `activity_log` entry of type `chore_reversed` (FR-004)
- [x] T013 Update `app/(dashboard)/page.tsx` — include `uncheckCount` in completions passed to `ChoreList`
- [x] T014 Modify `components/chore-list/ChoreItem.tsx` — when `uncheckCount > 0 && isCompleted`, disable the checkbox

### Tests

- [x] T015 [P] Write integration test in `__tests__/integration/chore-uncheck-limit.test.ts`
- [x] T016 [P] Write E2E test in `__tests__/e2e/chore-uncheck-limit.spec.ts`

**Checkpoint**: Chore uncheck limited to once per day

---

## ~~Phase 5: Undo Rest Day~~ — REMOVED

Tasks T017–T022 removed. Rest Day is also permanent once declared.

---

## Phase 6: Disable Tasks After End Day

**Goal**: Once a kid ends their day, the task section is hidden and task completion is blocked server-side.

**Independent Test**: End the day, verify the Tasks section is no longer visible. Attempt to complete a task directly — verify rejection.

- [x] T026 [P] Add server-side guard to `completeTaskAction` in `lib/actions/tasks.ts` — fetch today's `day_records` row and throw `'Cannot complete tasks after ending the day'` if `ended_at` is non-null
- [x] T027 Update `components/task-list/TaskSection.tsx` — add `isEnded: boolean` prop; return `null` when `isEnded`
- [x] T028 Update `app/(dashboard)/page.tsx` — pass `isEnded={isEnded}` to `TaskSection`

### Tests

- [x] T029 [P] Write E2E test in `__tests__/e2e/task-locked-after-end-day.spec.ts`

**Checkpoint**: After ending the day, Tasks section hidden and server-side guard active

---

## Phase 7: Effort Levels — REMOVED

The entire Effort Levels feature was removed on 2026-05-16:
- Deleted: `components/effort-dropdown/EffortDropdown.tsx`
- Deleted: `lib/actions/effort-levels.ts`, `lib/db/effort-levels.ts`
- Deleted: `app/(admin)/admin/effort/`
- Deleted: `__tests__/e2e/us8-effort-levels.spec.ts`
- Modified: `EndDayButton` — removed `effortLevels` prop and dropdown
- Modified: `endDay` server action — removed `effortLevelId` parameter

---

## Phase 7b: End Day Atomicity

**Goal**: Replace sequential multi-write `endDay` with a single PostgreSQL RPC call so partial failure is impossible.

**Independent Test**: End the day — verify `ended_at` is set, penalty and rewards are logged, and no partial state exists on RPC failure.

- [ ] T032 Create migration `supabase/migrations/0016_end_day_atomic.sql` — implement `end_day(p_day_record_id uuid) RETURNS jsonb` PL/pgSQL function (validates ownership, idempotent check, inserts penalty + chore reward log entries, sets `ended_at`, inserts `day_ended` log entry — all in one implicit transaction)
- [ ] T033 Update `endDay` in `lib/actions/day-records.ts` — replace multi-write body with `supabase.rpc('end_day', { p_day_record_id: dayRecordId })`; keep auth fast-fail before the RPC call
- [ ] T034 Regenerate `lib/database.types.ts` after applying migration 0016 (`bunx supabase gen types typescript --local`)

### Tests

- [ ] T035 [P] Write integration test in `__tests__/integration/end-day-atomic.test.ts` — verify atomicity: RPC failure leaves no partial writes
- [ ] T036 [P] Write E2E test in `__tests__/e2e/end-day.spec.ts` — happy path: end day, verify Tasks section hidden, points updated

**Checkpoint**: End Day is atomic; partial failure impossible

---

## Phase 8: Polish & Regression

- [x] T024 Run all tests (`bun vitest` and `bun playwright test`) and verify no regressions
- [x] T031 Run all tests after US4 and removal changes

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phase 4 (Chore Uncheck)**: Depends on Phase 2
- **Phase 6 (Task Lock)**: Depends on Phase 2 only
- **Phase 7b (End Day Atomicity)**: Depends on Phase 1 (T034 depends on T032)
- **Phase 8 (Polish)**: Depends on all prior phases
