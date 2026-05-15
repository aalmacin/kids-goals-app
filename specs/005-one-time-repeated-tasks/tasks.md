# Tasks: One-Time and Repeated Tasks

**Input**: Design documents from `specs/005-one-time-repeated-tasks/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure) ✅

**Purpose**: Database migration and TypeScript type foundations needed by all phases.

- [x] T001 Create `supabase/migrations/0013_tasks.sql` — tasks + task_completions tables, partial unique index for one-time completions, RLS policies (parent ALL, kid SELECT on tasks; kid SELECT+INSERT on task_completions), and add `'task_completed'` to activity_log action_type CHECK constraint
- [x] T002 [P] Update `lib/types.ts` — add `Task` and `TaskCompletion` types; add `'task_completed'` to `ActivityLogEntry.actionType` union
- [x] T003 [P] Update `lib/database.types.ts` — add `tasks` and `task_completions` table definitions; add `'task_completed'` to activity_log action_type union

---

## Phase 2: Foundational (Blocking Prerequisites) ✅

**Purpose**: DB query layer and server actions shared by all user stories.

- [x] T004 Create `lib/db/tasks.ts` — implement `getTaskLibrary(familyId)`, `getAvailableTasksForKid(kidId, familyId)`, `createTask(...)`, `softDeleteTask(taskId)`, `getTaskCompletionCount(taskId, kidId)`
- [x] T005 Create `lib/actions/tasks.ts` (`'use server'`) — implement `createTaskAction(formData)`, `deleteTaskAction(taskId)`, `completeTaskAction(taskId)`

---

## Phase 3: User Story 1 — Complete a One-Time Task (Priority: P1) ✅

**Goal**: A kid sees a one-time task, clicks it, confirms via dialog, receives points, and the task disappears from the list.

- [x] T006 [P] [US1] Create `components/task-list/TaskItem.tsx` — client component with AlertDialog confirmation for one-time; direct click for repeated
- [x] T007 [P] [US1] Create `components/task-list/TaskList.tsx` — renders list of TaskItem components
- [x] T008 [US1] Update `app/(dashboard)/page.tsx` — call `getAvailableTasksForKid` and render `<TaskList>`
- [x] T009 [P] [US1] Write E2E test `__tests__/e2e/one-time-task.spec.ts`
- [x] T010 [P] [US1] Write unit test `__tests__/unit/task-completion-guard.test.ts`

---

## Phase 4: User Story 2 — Complete a Repeated Task (Priority: P2) ✅

**Goal**: A kid completes a repeated task multiple times, receives points each time, task disappears when capped.

- [x] T011 [US2] Update `components/task-list/TaskItem.tsx` — add remaining completions badge for capped tasks
- [x] T012 [P] [US2] Write E2E test `__tests__/e2e/repeated-task.spec.ts`

---

## Phase 5: User Story 3 — Manage Tasks via Admin (Priority: P3) ✅

**Goal**: Parent creates, views, and deletes one-time and repeated tasks.

- [x] T013 [US3] Update `app/(admin)/admin/layout.tsx` — add Tasks link to admin navbar
- [x] T014 [P] [US3] Create `app/(admin)/admin/tasks/page.tsx` — task CRUD page
- [x] T015 [P] [US3] Write E2E test `__tests__/e2e/admin-tasks.spec.ts`

---

## Phase 6: Polish (Original Feature) ✅

- [x] T016 [P] Write integration test `__tests__/integration/tasks.test.ts`
- [x] T017 Verify `quickstart.md` matches implementation

---

## Phase 7: Setup Extensions (Daily Count, Undo, Once-Per-Day)

**Purpose**: Database migration and type updates for the new task enhancements.

**⚠️ CRITICAL**: No enhancement work (Phases 9–10) can begin until this phase and Phase 8 are complete.

- [x] T018 Create `supabase/migrations/0014_task_extensions.sql` — add `once_per_day boolean NOT NULL DEFAULT false` column to `tasks` table; drop and re-add `activity_log_action_type_check` constraint to include `'task_completion_reversed'`; add DELETE RLS policy `kid_delete_own_task_completions` on `task_completions` for kids (own kid_id only)
- [x] T019 [P] Update `lib/types.ts` — add `oncePerDay: boolean` to `Task` type; add `TaskWithCounts` type (`Task & { todayCount: number }`); add `'task_completion_reversed'` to `ActivityLogEntry.actionType` union
- [x] T020 [P] Update `lib/database.types.ts` — add `once_per_day` to tasks table type definition; add `'task_completion_reversed'` to activity_log action_type union

---

## Phase 8: Foundational Extensions (Blocking Prerequisites for Enhancements)

**Purpose**: Updated DB layer and server actions that all enhancement UIs depend on.

**⚠️ CRITICAL**: No user story enhancement work (Phases 9–10) can begin until this phase is complete.

- [x] T021 Update `lib/db/tasks.ts` — update `mapTask` to include `oncePerDay` from `once_per_day` column; update `getAvailableTasksForKid(kidId, familyId, familyTimezone)` to accept `familyTimezone` parameter, return `TaskWithCounts[]` with `todayCount` (partition completions by today vs all-time using family timezone), filter out `once_per_day` tasks where `todayCount > 0`; update `createTask` signature to accept `oncePerDay: boolean`; add `undoLastTaskCompletion(taskId, kidId, familyTimezone)` that deletes the most recent completion for today and returns `{ pointsSnapshot: number } | null`
- [x] T022 Update `lib/actions/tasks.ts` — update `createTaskAction` to parse `oncePerDay` from FormData (`'on'` → true, force false for one_time type); update `completeTaskAction` to fetch family timezone and enforce `once_per_day` guard (reject if `todayCount > 0` with error `'Task already completed today'`); add `undoLastTaskCompletionAction(taskId)` server action (require kid session, fetch family timezone, validate task is repeated, call `undoLastTaskCompletion`, insert `activity_log` with `action_type: 'task_completion_reversed'` and `points_delta: -pointsSnapshot`, `revalidatePath('/')`)

**Checkpoint**: Foundation enhanced — UI work can now begin.

---

## Phase 9: User Story 2 Extension — Daily Count Display + Undo + Once-Per-Day (Priority: P2)

**Goal**: A kid sees how many times they've done a repeated task today, can undo accidental clicks, and cannot re-select once-per-day tasks after completing them.

**Independent Test**: Seed a repeated task (unlimited) and a once-per-day task. Log in as kid, complete unlimited task 3 times — see "done 3 times today" badge, click undo — count decreases to 2 and points deducted. Complete once-per-day task — task disappears from list for the rest of the day.

- [x] T023 [US2] Update `components/task-list/TaskList.tsx` — change props to accept `TaskWithCounts[]` instead of `Task[]`; pass `todayCount` to each `TaskItem`
- [x] T024 [US2] Update `components/task-list/TaskItem.tsx` — accept `todayCount` prop; for repeated tasks with `todayCount > 0`: show "done N today" badge (text-amber-600 border-amber-300); add undo button (Minus icon from lucide-react) that calls `undoLastTaskCompletionAction(task.id)` with its own `useTransition` pending state; keep existing functionality intact (AlertDialog for one-time, direct click for repeated)
- [x] T025 [US2] Update `app/(dashboard)/page.tsx` — pass `familyTimezone` to `getAvailableTasksForKid(kid.id, kid.family_id, familyTimezone)` call; type the result as `TaskWithCounts[]`; pass full `TaskWithCounts[]` to `<TaskList>`
- [x] T026 [P] [US2] Update E2E test `__tests__/e2e/repeated-task.spec.ts` — add test: daily count badge appears after completing a repeated task; add test: undo button reduces count and deducts points; add test: once-per-day task disappears after completion and cannot be clicked again same day

**Checkpoint**: Kids see daily counts, can undo accidental clicks, once-per-day tasks correctly restricted.

---

## Phase 10: User Story 3 Extension — Once-Per-Day Admin UI (Priority: P3)

**Goal**: A parent can create a repeated task flagged as "once per day" and see that flag displayed in the task list.

**Independent Test**: Log in as parent, create a repeated task with "Once per day" checked — task shows "once/day" badge in the admin list; create a one-time task — once-per-day checkbox not shown or irrelevant.

- [x] T027 [US3] Update `app/(admin)/admin/tasks/page.tsx` — add "Once per day" checkbox (`name="oncePerDay"`) shown conditionally when task type is `repeated` (requires extracting the form into a client component or using JS to toggle visibility); display "once/day" badge on tasks where `oncePerDay === true` in the task list
- [x] T028 [P] [US3] Update E2E test `__tests__/e2e/admin-tasks.spec.ts` — add test: create repeated task with once-per-day checked, verify it shows "once/day" badge in admin list and only allows one completion per day on kid dashboard

**Checkpoint**: Admin can create and identify once-per-day tasks.

---

## Phase 11: Polish & Cross-Cutting Tests

**Purpose**: Integration and unit test coverage for new enhancement logic.

- [x] T029 [P] Update integration test `__tests__/integration/tasks.test.ts` — add test: `once_per_day` filter correctly excludes tasks already done today; add test: kid DELETE RLS policy on `task_completions` works; add test: `task_completion_reversed` activity_log entry is created with correct negative `points_delta`
- [x] T030 [P] Update unit test `__tests__/unit/task-completion-guard.test.ts` — add test: `completeTaskAction` rejects repeated once-per-day task already completed today; add test: `undoLastTaskCompletionAction` rejects undo for one-time task; add test: `undoLastTaskCompletionAction` rejects undo when no same-day completion exists

---

## Phase 12: User Story 3 Extension — Task Editing (Priority: P3)

**Goal**: A parent can edit an existing task's name and point value from the admin task list. Type, once_per_day, and max_completions are immutable after creation. Existing activity log entries retain their snapshot values.

**Independent Test**: Log in as parent, create a task with 10 points, click edit, change name and points to 20, save — task list shows updated name and 20 points. Complete the edited task as a kid — activity log shows 20 points. Previous activity log entries still show the original 10 points.

### Implementation for User Story 3 Extension

- [ ] T031 [P] [US3] Add `updateTask(taskId: string, name: string, points: number)` function in `lib/db/tasks.ts` — UPDATE only name and points columns on tasks table, scoped to the task ID
- [ ] T032 [P] [US3] Add `updateTaskAction(taskId: string, formData: FormData)` server action in `lib/actions/tasks.ts` — require parent auth, parse and validate name (non-empty) and points (integer > 0) from FormData, call `updateTask`, call `revalidatePath('/admin/tasks')`
- [ ] T033 [US3] Create `components/admin/EditTaskDialog.tsx` — shadcn Dialog with form fields for name (Input, required) and points (Input, type=number, min=1); pre-populated with current values; form action calls `updateTaskAction`; follow pattern from `components/edit-chore-dialog.tsx`
- [ ] T034 [US3] Update `app/(admin)/admin/tasks/page.tsx` — add edit button (Pencil icon from lucide-react) next to each task's delete button; render `EditTaskDialog` per task passing current task data; pass task list as client component props for dialog state
- [ ] T035 [P] [US3] Write E2E test `__tests__/e2e/admin-task-edit.spec.ts` — test: edit task name and points, verify updated values in admin list; test: complete edited task as kid, verify new points in activity log; test: verify type/once_per_day/max_completions fields are not shown in edit dialog

**Checkpoint**: Parents can edit task name and points. Snapshot integrity verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phases 1–6 (Original)**: ✅ Complete
- **Phase 7 (Setup Extensions)**: ✅ Complete
- **Phase 8 (Foundational Extensions)**: ✅ Complete
- **Phase 9 (US2 Extension)**: ✅ Complete
- **Phase 10 (US3 Extension)**: ✅ Complete
- **Phase 11 (Polish)**: ✅ Complete
- **Phase 12 (Task Editing)**: No dependencies on incomplete work — can start immediately. Existing `parent_all_tasks` RLS covers UPDATE.

### User Story Dependencies

- **US2 Extension (Phase 9)**: ✅ Complete
- **US3 Extension (Phase 10)**: ✅ Complete
- **US3 Edit Extension (Phase 12)**: No dependencies on other incomplete stories. Can start immediately.

### Parallel Opportunities (Phase 12)

- T031 and T032 run in parallel (different files: db vs actions)
- T033 depends on T032 (needs the server action to call)
- T034 depends on T033 (needs the dialog component)
- T035 runs in parallel with T034 (different file: E2E test)

---

## Parallel Example: Phase 12 (Task Editing)

```
Start immediately (all prior phases complete):
  Parallel:
    T031 — lib/db/tasks.ts (updateTask function)
    T032 — lib/actions/tasks.ts (updateTaskAction)
  Then sequential:
    T033 — EditTaskDialog.tsx (depends on T032)
    T034 — admin/tasks/page.tsx (depends on T033)
  Parallel with T034:
    T035 — E2E test (different file)
```

---

## Implementation Strategy

### Current State

Phases 1–11 are complete. Only Phase 12 (Task Editing) remains.

### Delivery Plan

1. Complete Phase 12: Task Editing (T031–T035)
2. **VALIDATE**: Parent can edit task name/points, snapshots preserved
3. Feature complete

---

## Notes

- [P] tasks = different files, no shared state dependencies
- Constitution requires E2E tests for all user-facing flows — included in Phases 9 and 10
- `undoLastTaskCompletionAction` only works for same-day completions (family timezone) — prevents gaming
- `once_per_day` is stored as a boolean on `tasks` — avoids overloading `max_completions`
- TaskItem undo button only appears for repeated tasks with `todayCount > 0`
- Family timezone is already available on the dashboard page (used for chore schedule logic)
