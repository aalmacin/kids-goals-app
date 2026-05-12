# Tasks: One-Time and Repeated Tasks

**Input**: Design documents from `specs/005-one-time-repeated-tasks/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and TypeScript type foundations needed by all phases.

- [ ] T001 Create `supabase/migrations/0007_tasks.sql` — tasks + task_completions tables, partial unique index for one-time completions, RLS policies (parent ALL, kid SELECT on tasks; kid SELECT+INSERT on task_completions), and add `'task_completed'` to activity_log action_type CHECK constraint
- [ ] T002 [P] Update `lib/types.ts` — add `Task` and `TaskCompletion` types; add `'task_completed'` to `ActivityLogEntry.actionType` union
- [ ] T003 [P] Update `lib/database.types.ts` — add `tasks` and `task_completions` table definitions; add `'task_completed'` to activity_log action_type union

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB query layer and server actions shared by all user stories.

**⚠️ CRITICAL**: No user story UI work can begin until this phase is complete.

- [ ] T004 Create `lib/db/tasks.ts` — implement `getTaskLibrary(familyId)`, `getAvailableTasksForKid(kidId, familyId)` (filters out completed one-time tasks and capped repeated tasks server-side), `createTask(...)`, `softDeleteTask(taskId)`, `getTaskCompletionCount(taskId, kidId)`
- [ ] T005 Create `lib/actions/tasks.ts` (`'use server'`) — implement `createTaskAction(formData)` (parent), `deleteTaskAction(taskId)` (parent), `completeTaskAction(taskId)` (kid: validates availability, inserts task_completion, inserts activity_log entry with `action_type: 'task_completed'` and `points_delta`, calls `revalidatePath('/')`)

**Checkpoint**: Foundation ready — all user story UI work can now begin.

---

## Phase 3: User Story 1 — Complete a One-Time Task (Priority: P1) 🎯 MVP

**Goal**: A kid sees a one-time task, clicks it, confirms via dialog, receives points, and the task disappears from the list.

**Independent Test**: Seed a one-time task for the family, log in as a kid, complete it with confirmation — points awarded, task no longer listed, completion appears in activity log.

- [ ] T006 [P] [US1] Create `components/task-list/TaskItem.tsx` — client component using `useTransition`; for `task_type === 'one_time'` wraps completion in shadcn `AlertDialog` (confirm/cancel); for `repeated` type calls `completeTaskAction` directly; shows task name, points badge, pending state
- [ ] T007 [P] [US1] Create `components/task-list/TaskList.tsx` — renders list of `TaskItem` components; shows empty state when no tasks available
- [ ] T008 [US1] Update `app/(dashboard)/page.tsx` — call `getAvailableTasksForKid` server-side and render `<TaskList>` below the chore list section
- [ ] T009 [P] [US1] Write E2E test `__tests__/e2e/one-time-task.spec.ts` — happy path (confirm completion, points awarded, task gone) and failure path (cancel dialog, task remains)
- [ ] T010 [P] [US1] Write unit test `__tests__/unit/task-completion-guard.test.ts` — test that `completeTaskAction` rejects a second completion of a one-time task

**Checkpoint**: User Story 1 fully functional — one-time task completion works end-to-end.

---

## Phase 4: User Story 2 — Complete a Repeated Task (Priority: P2)

**Goal**: A kid sees a repeated task, clicks it, receives points immediately, and the task remains available. If capped, the task disappears after reaching the limit.

**Independent Test**: Seed a repeated task (one with no limit, one with limit 2), log in as a kid, complete multiple times — points awarded each time, unlimited task always present, capped task disappears after 2 completions.

- [ ] T011 [US2] Update `components/task-list/TaskItem.tsx` — add visual indicator for capped repeated tasks showing remaining completions (e.g. `2 left` badge); no confirmation dialog for repeated type
- [ ] T012 [P] [US2] Write E2E test `__tests__/e2e/repeated-task.spec.ts` — happy path (multiple completions, points each time, task stays visible) and limit path (task disappears after hitting max_completions)

**Checkpoint**: User Story 2 complete — repeated task completion works with and without limits.

---

## Phase 5: User Story 3 — Manage Tasks via Admin (Priority: P3)

**Goal**: A parent navigates to Tasks via the admin navbar, creates one-time and repeated tasks, and sees them appear for kids.

**Independent Test**: Log in as parent, click "Tasks" in admin nav, create a one-time task and a repeated task with a limit — both appear on the kid's dashboard.

- [ ] T013 [US3] Update `app/(admin)/admin/layout.tsx` — add `<Link href="/admin/tasks">Tasks</Link>` to the admin navbar alongside existing links
- [ ] T014 [P] [US3] Create `app/(admin)/admin/tasks/page.tsx` — task CRUD page with: add-task form (name, points, task type selector, conditional max_completions field for repeated type), task list with soft-delete button; mirrors chores page pattern using shadcn Card, Input, Label, Button, Select, Badge
- [ ] T015 [P] [US3] Write E2E test `__tests__/e2e/admin-tasks.spec.ts` — happy path (create one-time task, verify appears for kid) and error path (attempt to save repeated task with max_completions = 0, verify rejected)

**Checkpoint**: All three user stories functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T016 [P] Write integration test `__tests__/integration/tasks.test.ts` — RLS policy tests (kid cannot see other family's tasks, parent cannot complete as kid), server action contract tests for `completeTaskAction` and `createTaskAction`
- [ ] T017 Verify `quickstart.md` matches final implementation (correct migration name, step count, accurate file paths); update if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story UI phases
- **Phase 3 (US1)**: Depends on Phase 2 — MVP deliverable
- **Phase 4 (US2)**: Depends on Phase 2 — T011 also depends on T006 (same file)
- **Phase 5 (US3)**: Depends on Phase 2 — independent of US1/US2
- **Phase 6 (Polish)**: Depends on Phases 3, 4, 5

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 complete. Independent of US2, US3.
- **US2 (P2)**: Requires Phase 2 complete. T011 depends on T006 (extends TaskItem). Independent of US3.
- **US3 (P3)**: Requires Phase 2 complete. Independent of US1, US2.

### Parallel Opportunities

- T002 and T003 run in parallel (different files)
- T006 and T007 run in parallel (different files)
- T009 and T010 run in parallel (different files)
- T014 and T015 run in parallel (different files)
- T013, T014 can start concurrently with Phase 3 work (different files)

---

## Parallel Example: User Story 1

```
After T004 + T005 complete:
  Parallel batch A:
    T006 — TaskItem component
    T007 — TaskList component
  Then:
    T008 — dashboard integration (depends on T006, T007)
  Parallel batch B (after T008):
    T009 — E2E test
    T010 — unit test
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T005)
3. Complete Phase 3: User Story 1 (T006–T010)
4. **STOP and VALIDATE**: Kids can complete one-time tasks
5. Deploy MVP

### Incremental Delivery

1. Setup + Foundational → DB + actions ready
2. Add US1 → one-time tasks end-to-end → deploy
3. Add US2 → repeated tasks → deploy
4. Add US3 → admin task management → deploy

---

## Notes

- [P] tasks = different files, no shared state dependencies
- Constitution requires E2E (Playwright) + integration + unit tests — included per phase
- `completeTaskAction` is the single mutation entry point for both task types; idempotency enforced there
- `getAvailableTasksForKid` does all availability filtering server-side (no client filtering needed)
- shadcn `AlertDialog` used for one-time confirmation (existing component, no install needed)
