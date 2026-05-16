# Tasks: Fix Inconsistent Reversal

**Input**: Design documents from `specs/005-fix-inconsistent-reversal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: E2E tests are MANDATORY (Principle V). Unit tests included where business logic requires coverage.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- Exact file paths included

---

## Phase 1: Setup

**Purpose**: Database migration and type updates

- [x] T001 Create migration `supabase/migrations/0015_undo_counts.sql` — add `undo_end_count` (integer NOT NULL DEFAULT 0, CHECK >= 0) and `undo_rest_day_count` (integer NOT NULL DEFAULT 0, CHECK >= 0) to `day_records`; add `uncheck_count` (integer NOT NULL DEFAULT 0, CHECK >= 0) to `chore_completions`; update `activity_log_action_type_check` constraint to include `rest_day_reversed`
- [x] T002 Regenerate `lib/database.types.ts` from local Supabase schema (`bunx supabase gen types typescript --local`)
- [x] T003 Update `lib/types.ts` — add `undoEndCount: number` and `undoRestDayCount: number` to `DayRecord` type; add `uncheckCount: number` to `ChoreCompletion` type; add `'day_undone' | 'penalty_reversed' | 'effort_reversed' | 'rest_day_reversed'` to `ActivityLogEntry.actionType` union

**Checkpoint**: Schema updated, types regenerated

---

## Phase 2: Foundational

**Purpose**: DB helper functions and undo eligibility logic shared by all stories

- [x] T004 [P] Add undo eligibility pure functions in `lib/undo-eligibility.ts` — `canUndoEndDay(dayRecord, today)`, `canUndoRestDay(dayRecord, today)`, `canUncheckChore(completion, isEnded)` returning boolean based on data-model eligibility rules
- [x] T005 [P] Update `lib/db/day-records.ts` — map `undo_end_count`, `undo_rest_day_count` in `getOrCreateDayRecord` return; map `uncheck_count` in chore completion queries
- [x] T006 [P] Write unit tests in `__tests__/unit/undo-eligibility.test.ts` for all three eligibility functions covering: eligible, exhausted, wrong date, day not ended (for undo end day)

**Checkpoint**: Foundation ready — all undo eligibility logic testable and DB layer updated

---

## Phase 3: User Story 1 — Undo End Day (Priority: P1) MVP

**Goal**: Allow kids to undo end-day once per day, with current-day restriction and proper point reversal

**Independent Test**: End a day, click Undo End Day, verify day reopens and points are reversed. Try to undo again — button should not appear.

### Implementation for User Story 1

- [x] T007 [US1] Modify `undoEndDay` in `lib/actions/day-records.ts` — add current-day check using `todayInTimezone` from `lib/chore-schedule.ts`; add `undo_end_count == 0` guard; increment `undo_end_count` on successful undo
- [x] T008 [US1] Update `app/(dashboard)/page.tsx` — compute `canUndoEnd` using eligibility function; conditionally render `UndoEndDayButton` only when eligible (not just when ended)
- [x] T009 [US1] Restyle `components/end-day/UndoEndDayButton.tsx` — change to large rounded-xl styling with bold font and prominent padding matching `EndDayButton`

### Tests for User Story 1

- [x] T010 [P] [US1] Write integration test in `__tests__/integration/undo-end-day.test.ts` — extend existing tests: verify undo blocked when `undo_end_count >= 1`; verify undo blocked for past dates; verify `undo_end_count` incremented after undo
- [x] T011 [P] [US1] Write E2E test in `__tests__/e2e/undo-end-day.spec.ts` — kid ends day, clicks Undo, verifies day reopened and chores toggleable; ends day again, verifies no Undo button shown

**Checkpoint**: Undo End Day works with one-undo limit and current-day restriction

---

## Phase 4: User Story 2 — Chore Uncheck Limit (Priority: P2)

**Goal**: Limit chore unchecking to once per chore per day. After one uncheck and re-complete, checkbox locks.

**Independent Test**: Complete a chore, uncheck it, re-complete it — checkbox should be locked (not uncheckable).

### Implementation for User Story 2

- [x] T012 [US2] Modify `toggleChore` in `lib/actions/day-records.ts` — when `completed=false` (unchecking), check `uncheck_count == 0` from DB; if > 0, throw error; on successful uncheck, increment `uncheck_count` on the `chore_completions` row
- [x] T013 [US2] Update `app/(dashboard)/page.tsx` — include `uncheck_count` (mapped as `uncheckCount`) in the completions passed to `ChoreList`
- [x] T014 [US2] Modify `components/chore-list/ChoreItem.tsx` — when `completion.uncheckCount > 0 && isCompleted`, disable the checkbox (lock it); add visual indicator (e.g., lock icon or muted style) showing the chore is permanently checked

### Tests for User Story 2

- [x] T015 [P] [US2] Write integration test in `__tests__/integration/chore-uncheck-limit.test.ts` — verify first uncheck succeeds and increments count; verify second uncheck rejected; verify checking (completing) always allowed regardless of count
- [x] T016 [P] [US2] Write E2E test in `__tests__/e2e/chore-uncheck-limit.spec.ts` — kid completes chore, unchecks it, re-completes it, verifies checkbox is locked/disabled

**Checkpoint**: Chore uncheck limited to once per day

---

## Phase 5: User Story 3 — Consistent Visual Feedback + Undo Rest Day (Priority: P3)

**Goal**: Undo rest day with one-undo limit. Consistent large button styling across all undo actions.

**Independent Test**: Purchase rest day, click Undo Rest Day, verify 100 points returned and rest day cleared. Button should not appear after undo.

### Implementation for User Story 3

- [x] T017 [US3] Add `undoRestDay` server action in `lib/actions/day-records.ts` — check `undo_rest_day_count == 0` and `date == today`; set `is_rest_day = false`; increment `undo_rest_day_count`; insert `rest_day_reversed` activity_log entry with `points_delta: +100`
- [x] T018 [US3] Create `components/rest-day/UndoRestDayButton.tsx` — AlertDialog confirmation with large rounded-xl styling; explain that 100 points will be returned; call `undoRestDay` on confirm
- [x] T019 [US3] Modify `components/rest-day/RestDayButton.tsx` — when `isRestDay && canUndoRestDay`, render `UndoRestDayButton` instead of the static "Rest Day Active" badge
- [x] T020 [US3] Update `app/(dashboard)/page.tsx` — compute `canUndoRestDay` from day record; pass to `RestDayButton`

### Tests for User Story 3

- [x] T021 [P] [US3] Write integration test in `__tests__/integration/undo-rest-day.test.ts` — verify undo returns 100 points, clears is_rest_day, increments count; verify second undo rejected; verify past-date undo rejected
- [x] T022 [P] [US3] Write E2E test in `__tests__/e2e/undo-rest-day.spec.ts` — kid purchases rest day, clicks Undo, verifies points returned and rest day cleared; verifies no undo button after first undo

**Checkpoint**: All undo actions consistent with one-undo-per-day rule and prominent button styling

---

## Phase 6: User Story 4 — Disable Effort (Task) Feature After Ending Day (Priority: P4)

**Goal**: Once a kid ends their day, the task section is hidden and task completion is blocked server-side. End Day is a complete terminal action for all daily point-earning activities.

**Independent Test**: End the day, verify the Tasks section is no longer visible on the dashboard. Attempt to complete a task via the server action directly — verify it is rejected with "Cannot complete tasks after ending the day".

### Implementation for User Story 4

- [x] T025 [P] [US4] Fix `canUndoRestDay` in `lib/undo-eligibility.ts` — add `&& dayRecord.endedAt === null` condition so eligibility is false when the day has ended (spec: "Undo rest day is only available before the day is ended")
- [x] T026 [P] [US4] Add server-side guard to `completeTaskAction` in `lib/actions/tasks.ts` — after getting `kid`, fetch today's `day_records` row (`date` = today in family timezone) and throw `'Cannot complete tasks after ending the day'` if `ended_at` is non-null; reuse `todayInTimezone` from `lib/chore-schedule.ts` and `getFamilyTimezone` already in the file
- [x] T027 [US4] Update `components/task-list/TaskSection.tsx` — add `isEnded: boolean` prop; return `null` when `isEnded` is true (entire section hidden when day is ended)
- [x] T028 [US4] Update `app/(dashboard)/page.tsx` — pass `isEnded={isEnded}` to `TaskSection` component

### Tests for User Story 4

- [x] T029 [P] [US4] Add unit test in `__tests__/unit/undo-eligibility.test.ts` — extend existing suite with cases for `canUndoRestDay` when `endedAt` is set: verify returns `false` even when `isRestDay=true`, `undoRestDayCount=0`, and `date==today`
- [x] T030 [P] [US4] Write E2E test in `__tests__/e2e/task-locked-after-end-day.spec.ts` — kid completes a repeated task (verifying it appears), then ends the day; verify the Tasks section is no longer visible; undo end day; verify Tasks section reappears

**Checkpoint**: After ending the day, the Tasks section is hidden and task completion is blocked server-side

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T023 Update `components/activity-log/ActivityLogTable.tsx` — add display labels for `rest_day_reversed` action type
- [x] T024 Run all tests (`bun vitest` and `bun playwright test`) and verify no regressions
- [x] T031 Run all tests (`bun vitest` and `bun playwright test`) and verify no regressions after US4 changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phases 3–5 (US1–US3)**: All depend on Phase 2. Complete — no further work needed.
- **Phase 6 (US4)**: Depends on Phase 2 only. No dependencies on US1–US3.
- **Phase 7 (Polish)**: Depends on Phase 6

### User Story 4 Task Dependencies

- T025 and T026 can run in parallel (different files, no shared dependencies)
- T027 depends on nothing (self-contained component change)
- T028 depends on T027 (must add prop to TaskSection before passing it from page)
- T029 can run in parallel with T025–T028 (test-only file)
- T030 depends on T025–T028 (E2E validates full stack)

### Parallel Opportunities

- T025, T026, T027, T029 can all run in parallel
- T028 after T027
- T030 after T025–T028
- T031 after T030

---

## Implementation Strategy

### MVP (User Story 4 only)

1. Complete T025 + T026 in parallel — eligibility fix + server-side guard
2. Complete T027 — update TaskSection component
3. Complete T028 — wire isEnded in page
4. Complete T029 + T030 in parallel — unit test + E2E
5. **STOP and VALIDATE**: `bun vitest` + `bun playwright test`
6. Complete T031 — final regression check

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- T025–T031 are the only remaining tasks (T001–T024 are complete)
- Task undo (`undoLastTaskCompletionAction`) does NOT need a day-ended guard — if the task section is hidden, no undo UI is accessible; server-side task completion block is sufficient
- Commit after each task or logical group
