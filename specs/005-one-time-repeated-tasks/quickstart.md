# Quickstart: One-Time and Repeated Tasks

## Prerequisites

- Supabase CLI installed
- Local Supabase instance running (`bun run db:start`)

---

## 1. Apply Database Migrations

**Migration 0013** (already in codebase): Creates `tasks` and `task_completions` tables, enables RLS, adds `task_completed` action type.

**Migration 0014** (new):
```bash
bun run db:reset
```

Migration 0014 adds:
- `tasks.once_per_day` boolean column
- `task_completion_reversed` to activity_log action_type CHECK constraint
- DELETE RLS policy on `task_completions` for kids

---

## 2. Update TypeScript Types (`lib/types.ts`)

- Add `oncePerDay: boolean` to `Task`
- Add `TaskWithCounts = Task & { todayCount: number }`
- Add `'task_completion_reversed'` to `ActivityLogEntry.actionType` union

---

## 3. Update DB Query Layer (`lib/db/tasks.ts`)

- Update `mapTask` to map `once_per_day` column
- Update `getAvailableTasksForKid(kidId, familyId, familyTimezone)`:
  - Accept `familyTimezone` parameter
  - Partition completions into "today" (>= start of calendar day) and "all-time"
  - Apply once_per_day filter using `todayCount`
  - Return `TaskWithCounts[]`
- Update `createTask` signature to accept `oncePerDay`
- Add `undoLastTaskCompletion(taskId, kidId, familyTimezone)` function

---

## 4. Update Server Actions (`lib/actions/tasks.ts`)

- Update `createTaskAction`: parse `oncePerDay` from FormData, force `false` for `one_time` tasks
- Update `completeTaskAction`: fetch family timezone, enforce `once_per_day` guard
- Add `undoLastTaskCompletionAction(taskId)`: require kid session, fetch family timezone, call `undoLastTaskCompletion`, insert reversal activity_log entry

---

## 5. Update Admin UI (`app/(admin)/admin/tasks/page.tsx`)

- Add `oncePerDay` checkbox to the create task form
- Make checkbox conditionally visible based on selected task type (requires converting the Select to a controlled client component or using a hidden input approach)
- Display `once_per_day` badge in the task list

---

## 6. Update Kid Dashboard UI

- `components/task-list/TaskList.tsx`: accept `TaskWithCounts[]`
- `components/task-list/TaskItem.tsx`:
  - Receive `todayCount` prop
  - Show "done N times today" badge for repeated tasks when `todayCount > 0`
  - Show undo button for repeated tasks when `todayCount > 0`
  - Undo button calls `undoLastTaskCompletionAction`
- `app/(dashboard)/page.tsx`: pass `familyTimezone` to `getAvailableTasksForKid`, pass `TaskWithCounts[]` to `TaskList`

---

## 7. Run Tests

```bash
# Unit + integration
bun vitest run

# E2E (requires seeded local Supabase)
bun playwright test
```

Key test files:
- `__tests__/unit/task-completion-guard.test.ts` — once_per_day guard, undo guard
- `__tests__/integration/tasks.test.ts` — once_per_day filter, undo RLS, reversal log
- `__tests__/e2e/repeated-task.spec.ts` — daily count display, undo flow, once-per-day enforcement
- `__tests__/e2e/admin-tasks.spec.ts` — once_per_day checkbox in create form
