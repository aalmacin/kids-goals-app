# Tasks: Fix Inconsistent Reversal

**Input**: Design documents from `specs/005-fix-inconsistent-reversal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: E2E tests are MANDATORY (Constitution Principle V). Unit/integration tests included where business logic requires coverage.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and type updates shared by all user stories

- [x] T001 Create migration `supabase/migrations/0015_undo_counts.sql` — add `uncheck_count` to `chore_completions`; retain `undo_end_count`/`undo_rest_day_count` in `day_records` (unused); add `rest_day_reversed` to `activity_log_action_type_check` constraint
- [x] T002 Regenerate `lib/database.types.ts` from local Supabase schema (`bunx supabase gen types typescript --local`)
- [x] T003 Update `lib/types.ts` — add `uncheckCount: number` to `ChoreCompletion`; add `'day_undone' | 'penalty_reversed' | 'rest_day_reversed' | 'effort_reversed'` to `ActivityLogEntry.actionType` union; remove `EffortLevel` type; remove `undoEndCount`, `undoRestDayCount`, `effortLevelId` from `DayRecord`

**Checkpoint**: Schema migrated, types regenerated — user story work can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Undo eligibility pure logic and DB query updates needed by all stories

- [x] T004 [P] Add `canUncheckChore(completion, isEnded): boolean` in `lib/undo-eligibility.ts` — returns true only if `completed_at !== null` and `uncheckCount === 0` and `!isEnded`
- [x] T005 [P] Update `lib/db/day-records.ts` — map `uncheck_count` from DB rows to `uncheckCount` in `ChoreCompletion`
- [x] T006 [P] Write unit tests in `__tests__/unit/undo-eligibility.test.ts` for `canUncheckChore` (all state combinations)

**Checkpoint**: Foundation ready — undo eligibility logic is independently testable

---

## Phase 3: User Story 1 — Chore Uncheck Limited to Once Per Day (Priority: P1) MVP

**Goal**: Kids can uncheck a completed chore exactly once per day. After one uncheck + re-complete, the checkbox is permanently locked for that day.

**Independent Test**: Complete a chore → uncheck it → re-complete it → verify checkbox is locked (disabled).

### Implementation

- [x] T012 [US1] Modify `toggleChore` in `lib/actions/day-records.ts` — on uncheck (`completed=false`): check `uncheck_count == 0`; throw if > 0; on successful uncheck increment `uncheck_count` and insert `activity_log` entry of type `chore_unchecked` (FR-004)
- [x] T013 [US1] Update `app/(dashboard)/page.tsx` — include `uncheckCount` in completions passed to `ChoreList`
- [x] T014 [US1] Modify `components/chore-list/ChoreItem.tsx` — disable the checkbox when `uncheckCount > 0 && isCompleted`

### Tests

- [x] T015 [P] [US1] Write integration test in `__tests__/integration/chore-uncheck-limit.test.ts`
- [x] T016 [P] [US1] Write E2E test in `__tests__/e2e/chore-uncheck-limit.spec.ts`

**Checkpoint**: Chore uncheck is limited to once per day — independently verifiable

---

## Phase 4: User Story 2 — Consistent Visual Feedback for Undo State (Priority: P2)

**Goal**: UI clearly shows when undo is available vs. exhausted (locked checkbox).

**Independent Test**: Observe chore checkbox UI state across: (a) never completed, (b) completed + undo available, (c) completed + undo exhausted.

> US2 is delivered by T014 (disabled checkbox state in `ChoreItem.tsx`), which was implemented as part of US1. No additional implementation tasks required.

**Checkpoint**: Visual lock state is visible — covered by US1 E2E test (T016)

---

## Phase 5: User Story 3 — Tasks Hidden After End Day (Priority: P3)

**Goal**: Once a kid ends their day, the Tasks section is hidden and task completion is rejected server-side.

**Independent Test**: End the day → verify Tasks section is gone from dashboard → attempt `completeTaskAction` directly → verify rejection error.

### Implementation

- [x] T026 [P] [US3] Add server-side guard to `completeTaskAction` in `lib/actions/tasks.ts` — fetch today's `day_records` row; throw `'Cannot complete tasks after ending the day'` if `ended_at` is non-null
- [x] T027 [P] [US3] Update `components/task-list/TaskSection.tsx` — add `isEnded: boolean` prop; return `null` when `isEnded`
- [x] T028 [US3] Update `app/(dashboard)/page.tsx` — pass `isEnded={isEnded}` to `TaskSection`

### Tests

- [x] T029 [P] [US3] Write E2E test in `__tests__/e2e/task-locked-after-end-day.spec.ts`

**Checkpoint**: Tasks section hidden and server guard active after End Day

---

## Phase 6: End Day Atomicity (Technical Requirement from Research)

**Goal**: Replace sequential multi-write `endDay` with a single PostgreSQL RPC so partial failure is impossible.

**Independent Test**: Simulate an RPC constraint failure mid-execution → verify no partial writes remain. Happy path: end day → `ended_at` set, penalty + rewards logged atomically.

### Implementation

- [x] T032 Create migration `supabase/migrations/0016_end_day_atomic.sql` — implement `end_day(p_day_record_id uuid) RETURNS jsonb` PL/pgSQL SECURITY DEFINER function (validates ownership via `auth.uid()`, idempotent check, inserts `penalty_applied` log, inserts one `chore_completion_reward` log per rewarded completion, sets `ended_at`, inserts `day_ended` log — all in one implicit transaction; see data-model.md for full function body)
- [x] T033 Update `endDay` in `lib/actions/day-records.ts` — replace multi-write body with `supabase.rpc('end_day', { p_day_record_id: dayRecordId })`; keep auth fast-fail (`supabase.auth.getUser()`) before the RPC call
- [x] T034 Regenerate `lib/database.types.ts` after applying migration 0016 (`bunx supabase gen types typescript --local`)

### Tests

- [x] T035 [P] Write integration test in `__tests__/integration/end-day-atomic.test.ts` — verify atomicity: simulate constraint violation, assert no partial writes
- [x] T036 [P] Write E2E test in `__tests__/e2e/end-day.spec.ts` — happy path: end day, verify Tasks section hidden, points updated correctly

**Checkpoint**: End Day is atomic — partial failure impossible

---

## Phase 7: Removed Features Cleanup

The following were deleted as part of this branch:

- [x] T037 [P] Delete `UndoEndDayButton` component and `undoEndDay` server action
- [x] T038 [P] Delete `UndoRestDayButton` component and `undoRestDay` server action
- [x] T039 [P] Delete Effort Levels: `EffortDropdown`, `edit-effort-level-dialog.tsx`, `lib/actions/effort-levels.ts`, `lib/db/effort-levels.ts`, `app/(admin)/admin/effort/`, `__tests__/e2e/us8-effort-levels.spec.ts`
- [x] T040 Remove `effortLevels` prop from `EndDayButton` and `effortLevelId` param from `endDay` server action

---

## Phase 8: Polish & Regression

- [x] T024 Run all tests (`bun vitest` and `bun playwright test`) — verify no regressions after chore + task changes
- [x] T041 Run all tests after Phase 6 (End Day Atomicity) — `bun vitest` and `bun playwright test`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phase 3 (US1 Chore Uncheck)**: Depends on Phase 2
- **Phase 4 (US2 Visual Feedback)**: Delivered by Phase 3 — no additional work
- **Phase 5 (US3 Task Lock)**: Depends on Phase 2 only (independent of Phase 3)
- **Phase 6 (End Day Atomicity)**: Depends on Phase 1 (T034 depends on T032)
- **Phase 7 (Cleanup)**: Can run in parallel with Phases 3–6 (different files)
- **Phase 8 (Polish)**: Depends on all prior phases

### Parallel Opportunities

- Phases 3, 5, 6, and 7 can all start after Phase 2 completes
- Within Phase 6: T032 → T033 → T034 (sequential); T035 and T036 can start after T032

---

## Parallel Example: Phase 6 (End Day Atomicity)

```bash
# After T032 is merged:
Task A: T033 — update endDay server action
Task B: T035 — write integration test (can be written against the SQL spec before T033)
Task C: T036 — write E2E test skeleton
```

---

## Implementation Strategy

### Remaining Work (MVP Complete — Phase 6 Only)

Phases 1–5 and 7 are complete. Only End Day Atomicity (Phase 6) and final regression (T041) remain.

1. Complete Phase 6: T032 → T033 → T034 (sequential)
2. Complete Phase 6 tests: T035, T036 (parallel after T032)
3. Complete T041: full regression run
4. **DONE** — all user stories and technical requirements satisfied

---

## Notes

- `[P]` = different files, no shared state — can run in parallel
- `[US#]` = maps task to user story for traceability
- Preserve checked `[x]` status — completed tasks must not be re-run
- All E2E tests must pass locally before branch is considered complete (Constitution Principle V)
