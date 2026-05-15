# Tasks: Fix Inconsistent Reversal

**Input**: Design documents from `specs/005-fix-inconsistent-reversal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: E2E tests are MANDATORY (Principle V). Unit and integration tests included where business logic and server actions require coverage.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths included

---

## Phase 1: Setup

**Purpose**: Database migration and type updates

- [ ] T001 Create migration `supabase/migrations/0015_undo_counts.sql` — add `undo_end_count` (integer NOT NULL DEFAULT 0, CHECK >= 0) and `undo_rest_day_count` (integer NOT NULL DEFAULT 0, CHECK >= 0) to `day_records`; add `uncheck_count` (integer NOT NULL DEFAULT 0, CHECK >= 0) to `chore_completions`; update `activity_log_action_type_check` constraint to include `rest_day_reversed`
- [ ] T002 Regenerate `lib/database.types.ts` from local Supabase schema (`bunx supabase gen types typescript --local`)
- [ ] T003 Update `lib/types.ts` — add `undoEndCount: number` and `undoRestDayCount: number` to `DayRecord` type; add `uncheckCount: number` to `ChoreCompletion` type; add `'day_undone' | 'penalty_reversed' | 'effort_reversed' | 'rest_day_reversed'` to `ActivityLogEntry.actionType` union

**Checkpoint**: Schema updated, types regenerated

---

## Phase 2: Foundational

**Purpose**: DB helper functions and undo eligibility logic shared by all stories

- [ ] T004 [P] Add undo eligibility pure functions in `lib/undo-eligibility.ts` — `canUndoEndDay(dayRecord, today)`, `canUndoRestDay(dayRecord, today)`, `canUncheckChore(completion, isEnded)` returning boolean based on data-model eligibility rules
- [ ] T005 [P] Update `lib/db/day-records.ts` — map `undo_end_count`, `undo_rest_day_count` in `getOrCreateDayRecord` return; map `uncheck_count` in chore completion queries
- [ ] T006 [P] Write unit tests in `__tests__/unit/undo-eligibility.test.ts` for all three eligibility functions covering: eligible, exhausted, wrong date, day not ended (for undo end day)

**Checkpoint**: Foundation ready — all undo eligibility logic testable and DB layer updated

---

## Phase 3: User Story 1 — Undo End Day (Priority: P1) MVP

**Goal**: Allow kids to undo end-day once per day, with current-day restriction and proper point reversal

**Independent Test**: End a day, click Undo End Day, verify day reopens and points are reversed. Try to undo again — button should not appear.

### Implementation for User Story 1

- [ ] T007 [US1] Modify `undoEndDay` in `lib/actions/day-records.ts` — add current-day check using `todayInTimezone` from `lib/chore-schedule.ts`; add `undo_end_count == 0` guard; increment `undo_end_count` on successful undo
- [ ] T008 [US1] Update `app/(dashboard)/page.tsx` — compute `canUndoEnd` using eligibility function; conditionally render `UndoEndDayButton` only when eligible (not just when ended)
- [ ] T009 [US1] Restyle `components/end-day/UndoEndDayButton.tsx` — change to large rounded-xl styling with bold font and prominent padding matching `EndDayButton`

### Tests for User Story 1

- [ ] T010 [P] [US1] Write integration test in `__tests__/integration/undo-end-day.test.ts` — extend existing tests: verify undo blocked when `undo_end_count >= 1`; verify undo blocked for past dates; verify `undo_end_count` incremented after undo
- [ ] T011 [P] [US1] Write E2E test in `__tests__/e2e/undo-end-day.spec.ts` — kid ends day, clicks Undo, verifies day reopened and chores toggleable; ends day again, verifies no Undo button shown

**Checkpoint**: Undo End Day works with one-undo limit and current-day restriction

---

## Phase 4: User Story 2 — Chore Uncheck Limit (Priority: P2)

**Goal**: Limit chore unchecking to once per chore per day. After one uncheck and re-complete, checkbox locks.

**Independent Test**: Complete a chore, uncheck it, re-complete it — checkbox should be locked (not uncheckable).

### Implementation for User Story 2

- [ ] T012 [US2] Modify `toggleChore` in `lib/actions/day-records.ts` — when `completed=false` (unchecking), check `uncheck_count == 0` from DB; if > 0, throw error; on successful uncheck, increment `uncheck_count` on the `chore_completions` row
- [ ] T013 [US2] Update `app/(dashboard)/page.tsx` — include `uncheck_count` (mapped as `uncheckCount`) in the completions passed to `ChoreList`
- [ ] T014 [US2] Modify `components/chore-list/ChoreItem.tsx` — when `completion.uncheckCount > 0 && isCompleted`, disable the checkbox (lock it); add visual indicator (e.g., lock icon or muted style) showing the chore is permanently checked

### Tests for User Story 2

- [ ] T015 [P] [US2] Write integration test in `__tests__/integration/chore-uncheck-limit.test.ts` — verify first uncheck succeeds and increments count; verify second uncheck rejected; verify checking (completing) always allowed regardless of count
- [ ] T016 [P] [US2] Write E2E test in `__tests__/e2e/chore-uncheck-limit.spec.ts` — kid completes chore, unchecks it, re-completes it, verifies checkbox is locked/disabled

**Checkpoint**: Chore uncheck limited to once per day

---

## Phase 5: User Story 3 — Consistent Visual Feedback + Undo Rest Day (Priority: P3)

**Goal**: Undo rest day with one-undo limit. Consistent large button styling across all undo actions.

**Independent Test**: Purchase rest day, click Undo Rest Day, verify 100 points returned and rest day cleared. Button should not appear after undo.

### Implementation for User Story 3

- [ ] T017 [US3] Add `undoRestDay` server action in `lib/actions/day-records.ts` — check `undo_rest_day_count == 0` and `date == today`; set `is_rest_day = false`; increment `undo_rest_day_count`; insert `rest_day_reversed` activity_log entry with `points_delta: +100`
- [ ] T018 [US3] Create `components/rest-day/UndoRestDayButton.tsx` — AlertDialog confirmation with large rounded-xl styling; explain that 100 points will be returned; call `undoRestDay` on confirm
- [ ] T019 [US3] Modify `components/rest-day/RestDayButton.tsx` — when `isRestDay && canUndoRestDay`, render `UndoRestDayButton` instead of the static "Rest Day Active" badge
- [ ] T020 [US3] Update `app/(dashboard)/page.tsx` — compute `canUndoRestDay` from day record; pass to `RestDayButton`

### Tests for User Story 3

- [ ] T021 [P] [US3] Write integration test in `__tests__/integration/undo-rest-day.test.ts` — verify undo returns 100 points, clears is_rest_day, increments count; verify second undo rejected; verify past-date undo rejected
- [ ] T022 [P] [US3] Write E2E test in `__tests__/e2e/undo-rest-day.spec.ts` — kid purchases rest day, clicks Undo, verifies points returned and rest day cleared; verifies no undo button after first undo

**Checkpoint**: All undo actions consistent with one-undo-per-day rule and prominent button styling

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T023 Update `components/activity-log/ActivityLogTable.tsx` — add display labels for `rest_day_reversed` action type
- [ ] T024 Run all tests (`bun vitest` and `bun playwright test`) and verify no regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phases 3-5 (User Stories)**: All depend on Phase 2. Can proceed in priority order or in parallel.
- **Phase 6 (Polish)**: Depends on all user stories

### User Story Dependencies

- **US1 (Undo End Day)**: Depends on Phase 2 only — no cross-story dependencies
- **US2 (Chore Uncheck Limit)**: Depends on Phase 2 only — independent from US1
- **US3 (Undo Rest Day + Visual Consistency)**: Depends on Phase 2 only — independent from US1/US2

### Within Each User Story

- Implementation tasks before test tasks (tests validate implementation)
- Server action changes before component changes
- Page-level wiring after component changes

### Parallel Opportunities

- T004, T005, T006 can all run in parallel (Phase 2)
- T010, T011 can run in parallel (US1 tests)
- T015, T016 can run in parallel (US2 tests)
- T021, T022 can run in parallel (US3 tests)
- US1, US2, US3 can run in parallel after Phase 2

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration + types)
2. Complete Phase 2: Foundational (eligibility logic + DB helpers)
3. Complete Phase 3: US1 — Undo End Day with limits
4. **STOP and VALIDATE**: Test undo end day independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Undo End Day) → Test → Deploy (MVP!)
3. US2 (Chore Uncheck Limit) → Test → Deploy
4. US3 (Undo Rest Day) → Test → Deploy
5. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story independently testable
- Commit after each task or logical group
- Task undo is explicitly OUT OF SCOPE — no changes to task system
