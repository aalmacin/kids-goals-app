# Tasks: Fix Daily Task Reset

**Input**: Design documents from `/specs/007-fix-daily-task-reset/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Tests**: E2E tests are MANDATORY (Principle V — both user stories have UI flows).
Unit tests for `getTodayStart` are included per research.md findings.

**Organization**: Single foundational fix (one function) feeds both user stories.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Foundational — Fix `getTodayStart`

**Purpose**: The single root-cause fix that resolves both user stories. Must be complete before E2E tests can pass.

**⚠️ CRITICAL**: Both user stories depend on this fix.

- [x] T001 Fix `getTodayStart` in `lib/db/tasks.ts` to derive the UTC offset from the family's timezone using `Intl.DateTimeFormat` with `timeZoneName: 'longOffset'` and append it to the ISO 8601 datetime string so midnight is always computed in the family's timezone, not server local time

**Checkpoint**: Foundation ready — `getTodayStart("America/New_York")` now returns UTC midnight in New York, not UTC midnight.

---

## Phase 2: User Story 1 — Daily Task Resets After Midnight (Priority: P1) 🎯 MVP

**Goal**: Once-per-day tasks become available again on the next calendar day (in the user's local timezone).

**Independent Test**: Complete a once-per-day task, then call `getAvailableTasksForKid` with a timestamp from the next calendar day and verify `completedForNow` is `false` and the task is returned.

### Tests for User Story 1

- [x] T002 [P] [US1] Add unit tests for `getTodayStart` covering UTC, positive offset (e.g., Asia/Kolkata +05:30), negative offset (e.g., America/New_York -04:00), and half-hour offset timezones in `__tests__/unit/task-completion-guard.test.ts`
- [x] T003 [P] [US1] Add E2E test scenario "once-per-day task resets the next day" to `__tests__/e2e/repeated-task.spec.ts` — complete a once-per-day task, advance the system date by 1 day, verify task is available again

### Verify User Story 1

- [x] T004 [US1] Run `bun vitest __tests__/unit/task-completion-guard.test.ts` and confirm all `getTodayStart` unit tests pass
- [x] T005 [US1] Run E2E test for once-per-day reset with `bunx playwright test __tests__/e2e/repeated-task.spec.ts` and confirm it passes

**Checkpoint**: User Story 1 complete — once-per-day tasks reset at midnight in the user's local timezone.

---

## Phase 3: User Story 2 — Completed State Clears on New Day (Priority: P2)

**Goal**: Tasks completed yesterday appear in their uncompleted (available) state with no stale undo button on the next calendar day.

**Independent Test**: Seed a `task_completion` with `completed_at` set to yesterday (in the family's timezone), load the task list today, verify `completedForNow` is `false` and `todayCount` is `0`.

### Tests for User Story 2

- [x] T006 [P] [US2] Extend `__tests__/e2e/repeated-task.spec.ts` with a scenario "completed state does not persist across days" — seed a yesterday completion, view task list today, assert task appears uncompleted with no undo button

### Verify User Story 2

- [x] T007 [US2] Run `bunx playwright test __tests__/e2e/repeated-task.spec.ts` and confirm all daily-reset scenarios pass including US2 scenario

**Checkpoint**: User Stories 1 and 2 both pass — daily reset is correct and no stale UI state persists.

---

## Phase 4: Polish & Validation

**Purpose**: Confirm no regressions in existing task behavior and satisfy Constitution Principle V.

- [x] T008 [P] Run full unit test suite with `bun vitest` and confirm all pre-existing tests still pass
- [x] T009 [P] Run full E2E suite with `bunx playwright test __tests__/e2e/` and confirm no regressions in `one-time-task.spec.ts`, `repeated-task.spec.ts`, and `admin-tasks.spec.ts`
- [ ] T010 Implement Playwright seed fixture for once-per-day daily-reset E2E scenarios in `__tests__/e2e/fixtures/auth.ts` (or a dedicated `tasks.ts` fixture): seed a `task_completion` row with `completed_at` set to yesterday in the family timezone, then unskip the "resets next day" and "completed state does not persist" scenarios in `__tests__/e2e/repeated-task.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: Start immediately — single file change
- **User Stories (Phase 2–3)**: Both depend on Phase 1 completion
  - T002 and T003 can be written in parallel (different test scopes)
  - US2 tests (T006) can be written alongside US1 tests
- **Polish (Phase 4)**: After all user story verifications pass

### User Story Dependencies

- **US1 (P1)**: Depends only on T001 (foundational fix)
- **US2 (P2)**: Depends only on T001; US2 tests extend the same E2E file as US1

### Within Each User Story

- Write tests (T002, T003, T006) in parallel — different concerns
- Run unit verify (T004) before E2E verify (T005)
- Both story verifications must pass before polish phase

### Parallel Opportunities

- T002 and T003 can be written simultaneously (unit vs E2E)
- T006 can be written alongside T002/T003
- T008 and T009 can run simultaneously in polish phase

---

## Parallel Example: Phase 2 (US1 Tests)

```bash
# Write both test files concurrently:
Task: T002 — Unit tests for getTodayStart in __tests__/unit/task-completion-guard.test.ts
Task: T003 — E2E daily reset scenario in __tests__/e2e/repeated-task.spec.ts
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Fix `getTodayStart` (T001)
2. Complete Phase 2: Write & verify US1 tests (T002–T005)
3. **STOP and VALIDATE**: Once-per-day tasks reset correctly at local midnight
4. Ship fix

### Full Delivery

1. T001 → T002 + T003 (parallel) → T004 → T005
2. T006 → T007
3. T008 + T009 (parallel)

---

## Notes

- [P] tasks = different files, no shared state dependencies
- The fix is limited to `getTodayStart` in `lib/db/tasks.ts` — no schema changes, no new dependencies
- E2E tests for date-based behavior should mock or seed `completed_at` with explicit timestamps rather than relying on real clock — check existing `repeated-task.spec.ts` for the established pattern
- `bun` / `bunx` MUST be used for all commands (not npm/npx)
