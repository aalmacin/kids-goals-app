# Tasks: Task Completion Confirmation

**Input**: Design documents from `specs/005-task-completion-confirmation/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: E2E tests are MANDATORY per constitution Principle V. Unit/integration tests not explicitly requested.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: No new project setup needed — this feature modifies existing code. Phase skipped.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB query needed by the Tasks page before user stories can be implemented

- [ ] T001 Add `getCompletedOneTimeTasks(kidId, familyId)` function in `lib/db/tasks.ts` to return one-time tasks that have been completed by a kid, including completion metadata

**Checkpoint**: Foundation ready — all user stories can proceed.

---

## Phase 3: User Story 1 - Confirm Repeated Task Completion (Priority: P1)

**Goal**: Add AlertDialog confirmation when a kid taps a repeated task to complete it on the Today page.

**Independent Test**: Tap any available repeated task on Today page → confirmation dialog appears with task name and points.

### Implementation for User Story 1

- [ ] T002 [US1] Wrap the repeated task button in an AlertDialog in `components/task-list/TaskItem.tsx` — match the existing one-time task AlertDialog pattern (lines 133-152), showing task name and points to be earned

### E2E Tests for User Story 1

- [ ] T003 [US1] E2E test: repeated task completion confirmation dialog in `__tests__/e2e/task-completion-confirmation.spec.ts` — verify dialog appears on tap, confirm completes task, cancel leaves state unchanged

**Checkpoint**: Repeated task completion now requires confirmation.

---

## Phase 4: User Story 2 - Confirm Task Undo (Priority: P2)

**Goal**: Add AlertDialog confirmation when a kid taps the undo button on any task (repeated or one-time), warning about point deduction.

**Independent Test**: Complete a task, tap undo → confirmation dialog appears warning about point loss.

### Implementation for User Story 2

- [ ] T004 [US2] Wrap the undo button in an AlertDialog in `components/task-list/TaskItem.tsx` — show task name and points to be deducted, confirm triggers `undoLastTaskCompletionAction`, cancel does nothing

### E2E Tests for User Story 2

- [ ] T005 [US2] E2E test: task undo confirmation dialog in `__tests__/e2e/task-undo-confirmation.spec.ts` — verify dialog appears on undo tap, confirm reverses completion, cancel leaves state unchanged

**Checkpoint**: All task undo actions now require confirmation.

---

## Phase 5: User Story 3 - Separate One-Time Tasks Page (Priority: P1)

**Goal**: Move one-time tasks to a dedicated `/tasks` page with available and completed sections. Today page shows only repeated tasks. Nav bar includes "Tasks" link for kids.

**Independent Test**: Navigate to `/tasks` via nav bar → only one-time tasks shown with available/completed sections. Today page shows zero one-time tasks.

### Implementation for User Story 3

- [ ] T006 [P] [US3] Filter `TaskSection` in `app/(dashboard)/page.tsx` to pass only repeated tasks — filter `availableTasks` by `taskType === 'repeated'` before passing to `TaskSection`
- [ ] T007 [P] [US3] Add "Tasks" nav link for kid role in `components/navbar/NavBar.tsx` — add `<Link href="/tasks">Tasks</Link>` in the kid nav section
- [ ] T008 [P] [US3] Add "Tasks" nav link for kid role in `components/navbar/MobileMenu.tsx` — add matching link in the mobile menu kid section
- [ ] T009 [US3] Create one-time tasks page at `app/(dashboard)/tasks/page.tsx` — fetch one-time tasks using `getAvailableTasksForKid` (filtered to `one_time`) and completed one-time tasks using `getCompletedOneTimeTasks` from T001. Display available tasks using `TaskList`, and completed tasks in a separate "Completed" section below. Include empty states for both sections.

### E2E Tests for User Story 3

- [ ] T010 [US3] E2E test: one-time tasks page and nav in `__tests__/e2e/one-time-tasks-page.spec.ts` — verify nav link visible for kid, Tasks page shows only one-time tasks, completed section shows completed tasks, Today page shows zero one-time tasks

**Checkpoint**: One-time tasks fully separated onto dedicated page.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T011 Run quickstart.md verification steps to validate all flows end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on Phase 2 (but T001 is not directly needed — US1 only modifies TaskItem)
- **US2 (Phase 4)**: Can start after Phase 2, independent of US1 (modifies different section of TaskItem)
- **US3 (Phase 5)**: Depends on T001 (needs `getCompletedOneTimeTasks`)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1**: Independent — modifies repeated task section of `TaskItem.tsx`
- **US2**: Independent — modifies undo button section of `TaskItem.tsx`
- **US3**: Depends on T001 — needs the completed tasks query

### Parallel Opportunities

- T006, T007, T008 can all run in parallel (different files)
- US1 and US2 modify different sections of `TaskItem.tsx` but the same file — run sequentially to avoid conflicts
- US3 implementation tasks (T006-T008) can run in parallel with US1/US2

---

## Implementation Strategy

### MVP First (US1 + US3)

1. Complete T001 (foundational query)
2. Complete T002 (repeated task confirmation) → verify
3. Complete T006-T009 (Tasks page + nav) → verify
4. **STOP and VALIDATE**: Both P1 stories working independently

### Incremental Delivery

1. T001 → Foundation ready
2. US1 (T002-T003) → Repeated task confirmation working
3. US2 (T004-T005) → Undo confirmation working
4. US3 (T006-T010) → Tasks page live
5. T011 → Full verification

---

## Notes

- [P] tasks = different files, no dependencies
- US1 and US2 both modify `TaskItem.tsx` — implement sequentially
- US3 tasks T006-T008 modify different files and can run in parallel
- Commit after each task or logical group
